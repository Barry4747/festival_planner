output "instance_eip" {
  description = "Publiczny, stały adres IP powiązany z instancją"
  value       = aws_eip.lineup_eip.public_ip
}

output "nip_io_hostname" {
  description = "Gotowy hostname (nip.io) oparty o wygenerowany Elastic IP"
  value       = "${replace(aws_eip.lineup_eip.public_ip, ".", "-")}.nip.io"
}
