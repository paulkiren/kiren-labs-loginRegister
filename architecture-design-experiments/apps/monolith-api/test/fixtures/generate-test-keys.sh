#!/bin/bash
# Generate test RSA key pair for JWT testing
cd "$(dirname "$0")"

echo "Generating test RSA key pair..."
openssl genrsa -out test-jwt.key 2048
openssl rsa -in test-jwt.key -pubout -out test-jwt.pem

# Generate JWKS from public key
node -e "
const fs = require('fs');
const crypto = require('crypto');

const publicKey = fs.readFileSync('test-jwt.pem', 'utf8');
const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

const jwks = {
  keys: [{
    ...jwk,
    kid: 'test-key-1',
    use: 'sig',
    alg: 'RS256'
  }]
};

fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
console.log('JWKS file created successfully!');
"

echo "Test keys generated successfully!"
echo "- test-jwt.key (private key)"
echo "- test-jwt.pem (public key)"
echo "- jwks.json (JSON Web Key Set)"
