
# Storyboard JSON Schema — v2

## Struktur proyek

{
  "schemaVersion": 2,
  "application": "Auto Explainer Studio",
  "projectName": "Contoh Proyek",
  "format": "vertical",
  "coordinateSystem": "relative-1000",
  "scenes": []
}

## Struktur adegan

{
  "id": "scene-001",
  "title": "Judul Adegan",
  "subtitle": "Penjelasan adegan",
  "duration": 5,
  "elements": []
}

## Contoh elemen teks

{
  "id": "text-001",
  "type": "text",
  "text": "INFORMASI PENTING",
  "x": 500,
  "y": 400,
  "width": 800,
  "height": 150,
  "size": 70,
  "weight": 800,
  "color": "#171717",
  "start": 0.5,
  "duration": 4,
  "entrance": "slide-up",
  "entranceDuration": 0.65,
  "exitDuration": 0.4,
  "motion": "none"
}

## Contoh elemen kartu

{
  "id": "card-001",
  "type": "card",
  "label": "DATA DAN INFORMASI",
  "x": 500,
  "y": 600,
  "width": 700,
  "height": 250,
  "color": "#FFFFFF",
  "accent": "#A7C9B5",
  "start": 0.5,
  "duration": 4,
  "entrance": "pop",
  "motion": "float"
}

## Contoh elemen lingkaran

{
  "id": "circle-001",
  "type": "circle",
  "x": 800,
  "y": 300,
  "radius": 100,
  "color": "#DCE9E1",
  "start": 1,
  "duration": 3,
  "entrance": "scale"
}

## Koordinat

Semua x dan y menggunakan skala 0–1000.

Ukuran text dan card menggunakan skala relatif terhadap
lebar atau tinggi kanvas sesuai properti masing-masing.

Jangan menggunakan koordinat piksel untuk proyek baru.
