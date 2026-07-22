# --- Data Sources ---
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# --- Security Group ---
resource "aws_security_group" "lineup_sg" {
  name        = "lineup-prod-sg"
  description = "Security group for Lineup Prod"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH only from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lineup-prod-sg"
  }
}

# --- Key Pair ---
resource "aws_key_pair" "deployer" {
  key_name   = "lineup-deployer-key"
  public_key = var.ssh_public_key
}

# --- IAM Role & Instance Profile dla CloudWatch ---
resource "aws_iam_role" "ec2_role" {
  name = "lineup-prod-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cw_agent_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "lineup-prod-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# --- Elastic IP (Alokacja niezależna) ---
resource "aws_eip" "lineup_eip" {
  domain = "vpc"

  tags = {
    Name = "lineup-prod-eip"
  }
}

# --- Instancja EC2 ---
resource "aws_instance" "lineup_prod" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = tolist(data.aws_subnets.default.ids)[0]
  
  vpc_security_group_ids = [aws_security_group.lineup_sg.id]
  key_name               = aws_key_pair.deployer.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # Ładujemy skrypt jako szablon i wstrzykujemy hostname
  user_data = templatefile("${path.module}/bootstrap.sh.tpl", {
    nip_io_hostname = "${replace(aws_eip.lineup_eip.public_ip, ".", "-")}.nip.io"
    elastic_ip      = aws_eip.lineup_eip.public_ip
  })

  tags = {
    Name = "lineup-prod"
  }
}

# --- Przypisanie EIP do Instancji ---
resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.lineup_prod.id
  allocation_id = aws_eip.lineup_eip.id
}
