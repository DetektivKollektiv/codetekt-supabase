#!/bin/bash

# Hole den Access Token
TOKEN_RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  --header 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  --header 'Content-Type: application/json' \
  --data '{"email": "gorm-labenz@hotmail.com", "password": "testpassword123"}')

# Extrahiere den Access Token (mit jq oder grep/sed)
# Mit jq (empfohlen):
# ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# Falls jq nicht installiert ist, alternativ mit grep/sed:
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\(.*\)"/\1/')

echo "Access Token erhalten: ${ACCESS_TOKEN:0:20}..."

# Führe den eigentlichen Request aus
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-review-answer' \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{
    "case_id": "11111111-1111-4111-8111-111111111111",
    "data": {
      "keyword_type": ["Ukraine", "Russland", "Krieg", "Putin", "Zelensky"],
      "content_type": ["nachrichtenartikel"],
      "grammar": 1,
      "structure": 1,
      "headline": 1,
      "objectivity": 1,
      "perspectives": 1,
      "external_sources": 1,
      "claims_match_sources": 1,
      "public_media_match": 1,
      "author_credentials": 1,
      "images_quality": 1,
      "additional_rating": 1,
      "additional_comment": "Die Überschrift ist etwas reißerisch formuliert, könnte neutraler sein."
    }
  }'