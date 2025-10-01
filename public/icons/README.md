# Ícones PWA RuidCar

Este diretório contém os ícones necessários para o PWA da RuidCar.

## Ícones Necessários

Para gerar os ícones PWA a partir do SVG base `ruidcar-icon.svg`, execute:

```bash
# Usando ImageMagick (se disponível)
convert ruidcar-icon.svg -resize 72x72 icon-72x72.png
convert ruidcar-icon.svg -resize 96x96 icon-96x96.png
convert ruidcar-icon.svg -resize 128x128 icon-128x128.png
convert ruidcar-icon.svg -resize 144x144 icon-144x144.png
convert ruidcar-icon.svg -resize 152x152 icon-152x152.png
convert ruidcar-icon.svg -resize 192x192 icon-192x192.png
convert ruidcar-icon.svg -resize 384x384 icon-384x384.png
convert ruidcar-icon.svg -resize 512x512 icon-512x512.png

# Para ícones maskable (com padding extra)
convert ruidcar-icon.svg -resize 192x192 -background transparent -gravity center -extent 192x192 icon-192x192-maskable.png
convert ruidcar-icon.svg -resize 512x512 -background transparent -gravity center -extent 512x512 icon-512x512-maskable.png

# Ícones de shortcuts
convert ruidcar-icon.svg -resize 96x96 shortcut-search-96x96.png
convert ruidcar-icon.svg -resize 96x96 shortcut-location-96x96.png
```

## Usando online

Alternativamente, use ferramentas online como:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

## Fallback Temporário

O SVG pode ser usado temporariamente enquanto os PNGs não são gerados.