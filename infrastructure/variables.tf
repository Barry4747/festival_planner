variable "region" {
  description = "Region AWS, w którym zostaną wdrożone zasoby"
  type        = string
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "Typ instancji EC2"
  type        = string
  default     = "t3.micro"
}

variable "my_ip_cidr" {
  description = "Twój adres IP w formacie CIDR (np. '89.12.34.56/32') potrzebny do dostępu po SSH"
  type        = string
}

variable "ssh_public_key" {
  description = "Klucz publiczny SSH (zawartość pliku np. id_rsa.pub), który zostanie wgrany na EC2"
  type        = string
}
