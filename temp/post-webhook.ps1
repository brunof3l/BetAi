$ErrorActionPreference = 'Stop'
$uri = 'http://localhost:3001/api/webhooks/kirvano'
$body = @{ email = 'cliente@kirvano.com' } | ConvertTo-Json
$r = Invoke-WebRequest -UseBasicParsing -Method POST -Uri $uri -ContentType 'application/json' -Body $body
$r.Content