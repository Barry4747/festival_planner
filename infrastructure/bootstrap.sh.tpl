#!/bin/bash
set -e

# Logowanie wykonywania do pliku (ułatwia debugowanie w /var/log/user-data.log)
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

DOMAIN="${nip_io_hostname}"
EIP="${elastic_ip}"

echo "Rozpoczynam bootstrap dla domeny: $DOMAIN z publicznym IP: $EIP"

# 1. Aktualizacja systemu
dnf update -y

# 2. & 3. Instalacja i konfiguracja Dockera
dnf install -y git docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Ręczna instalacja Docker Compose z oficjalnego repozytorium GitHub
mkdir -p /usr/local/lib/docker/cli-plugins
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')
curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Weryfikacja instalacji Docker Compose..."
docker compose version

# 4. Instalacja certbota oraz standalone nginx na hoście (tylko na chwilę do wydania certyfikatu)
dnf install -y nginx certbot python3-certbot-nginx

# Oczekujemy aż EIP zostanie przypisane do uruchomionej instancji (wymagane by DNS .nip.io zadziałał)
echo "Czekam na faktyczne podpięcie Elastic IP do instancji..."
while true; do
  TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
  CURRENT_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
  if [ "$CURRENT_IP" == "$EIP" ]; then
    break
  fi
  sleep 5
done
echo "Elastic IP podpięte, można generować certyfikat..."

# 5. Generowanie certyfikatu Let's Encrypt (tymczasowo uruchamiamy lokalnego nginx)
systemctl start nginx
certbot certonly --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "admin@$DOMAIN" # Zamień ewentualnie na swój prawdziwy e-mail z alertami o wygasaniu

# Po wystawieniu certyfikatu, wyłączamy tymczasowego Nginx z hosta 
# Zwalniamy porty 80/443 dla naszego docelowego Nginx w kontenerze Dockera
systemctl stop nginx
systemctl disable nginx

# 6. Kontener nginx docker-compose po prostu zamontuje wolumen z hosta:
# volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro
# Katalog /etc/letsencrypt jest tworzony i zarządzany przez certbota bezpośrednio.

# 7. Systemd Timer dla auto-odnawiania certyfikatu
cat << 'EOF' > /etc/systemd/system/certbot-renew.service
[Unit]
Description=Let's Encrypt renewal service

[Service]
Type=oneshot
# post-hook zrestartuje nasz kontener 'nginx', żeby wczytał odświeżone pliki certyfikatów po udanym odnowieniu.
ExecStart=/usr/bin/certbot renew --quiet --post-hook "cd /opt/festival_planner && docker compose restart nginx"
EOF

cat << 'EOF' > /etc/systemd/system/certbot-renew.timer
[Unit]
Description=Twice daily renewal of Let's Encrypt's certificates

[Timer]
OnCalendar=*-*-* 03:00:00
OnCalendar=*-*-* 15:00:00
RandomizedDelaySec=43200
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now certbot-renew.timer

# 8. Tworzenie katalogu projektowego dla CI/CD
APP_DIR="/opt/festival_planner"
mkdir -p "$APP_DIR"
chown -R ec2-user:ec2-user "$APP_DIR"
# UWAGA: Ten katalog celowo pozostaje pusty po zakończeniu skryptu bootstrap.
# Zgodnie z architekturą, proces Github Actions (deploy.yml) przy każdym deployu 
# wygeneruje .env i przekopiuje docker-compose.prod.yml właśnie do tego katalogu, 
# skąd podniesione zostaną zaktualizowane kontenery.

# 9. Instalacja CloudWatch Agenta (konfiguracja dodana zostanie później)
dnf install -y amazon-cloudwatch-agent
systemctl enable --now amazon-cloudwatch-agent

echo "Zakończono skrypt bootstrapowy z sukcesem!"
