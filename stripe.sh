curl -fsSL https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | sudo gpg --dearmor -o /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe