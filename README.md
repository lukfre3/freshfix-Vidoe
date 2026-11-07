# FreshFix UF – reklamfilm för Alumninästet 2026

Färdig film: **`out/FreshFix_Alumninastet2026_1080p.mp4`** (16:9, 1920×1080, 30 fps, H.264 + AAC, ca 90 s).

Filmen byggs med [Remotion](https://www.remotion.dev) (React → video). Alla texter, färger och tider ligger i
två filer, så ni kan ändra filmen utan att röra animationerna.

## Snabbstart

```bash
npm install
npm run studio        # förhandsgranska och skrubba i webbläsaren
npm run render        # → out/FreshFix_Alumninastet2026_1080p.mp4
npm run render:4k     # → out/FreshFix_Alumninastet2026_4K.mp4 (3840×2160)
```

Ändrar ni tider i `src/timeline.json` – generera om ljudet så att musiken följer klippen:

```bash
pip install numpy scipy pillow opencv-python-headless
npm run audio         # → public/audio/soundtrack.wav
```

Byter ni ut originalbilder eller -klipp i `assets/source/`: kör `npm run assets` (kräver även ffmpeg).

## Projektstruktur

```
assets/source/            Originalmaterial (logga, produktfoton, filterpåse, förpackning, klipp, globala mål)
public/                   Bearbetat material som filmen använder
  img/                    Frilagda produktbilder (*_cutout.png), vit logotyp, foton
  video/                  iPhone-klippen konverterade från HDR till SDR, i slowmotion
  audio/soundtrack.wav    Musik + ljudeffekter (genereras av scripts/make_audio.py)
  fonts/                  Inter + Cormorant Garamond (fria typsnitt, OFL)
scripts/
  prepare_assets.py       Frilägger produkten, gör logotypen vit/transparent, konverterar klippen
  make_audio.py           Komponerar musiken och ljudeffekterna efter timeline.json
src/
  config.ts               ★ ALLA TEXTER OCH FÄRGER
  timeline.json           ★ ALLA TIDER (sekunder) – musiken följer dessa
  FreshFixFilm.tsx        Lägger scenerna i följd + ljudspåret
  scenes/S1Problem.tsx    Scen 1 – Problemet: matsvinnet
  scenes/S2Facts.tsx      Scen 2 – Fakta (med källhänvisningar)
  scenes/S3Solution.tsx   Scen 3 – "Vi presenterar FreshFixer"
  scenes/S4How.tsx        Scen 4 – Aktivt kol, zeolit, filterpåsen, montering
  scenes/S5Fridges.tsx    Scen 5 – Snabba kylskåpsbyten, produkten står still
  scenes/S6Sustain.tsx    Scen 6 – Hållbarhet
  scenes/S7Why.tsx        Scen 7 – Varför FreshFix UF?
  scenes/S8Finale.tsx     Scen 8 – Avslut, logotyp och uppmaning
  components/             Gemensamma delar (typografi, produkt, partiklar, kylskåp, linjegrafik)
```

## Om produktbilderna

FreshFixer visas **endast med era egna foton och klipp**. Produkten är frilagd från studiofotona (bara
bakgrunden är borttagen, exponeringen är något upplyst). Den ritas aldrig om eller genereras av AI, så
form, hål, slitsar och gravyr är exakt som i verkligheten. I kylskåpsscenen står samma bild på exakt samma
pixelposition och i samma storlek i alla kylskåp. Bara bakgrunden byts.

Kylskåpsmiljöerna, kol- och zeolitgranulerna och linjegrafiken är skapade med kod (inte stockfilm). Vill ni
senare byta in riktiga filmklipp (t.ex. mat som slängs eller riktiga kylskåp) kan de läggas i `public/video/`
och användas med `<OffthreadVideo>` i respektive scen.

## Källor för statistiken (visas diskret i filmen)

| Påstående i filmen | Källa |
| --- | --- |
| En barnfamilj (2 vuxna + 2 barn) slänger cirka 130 kg mat per år | Livsmedelsverket, *PM 2024 – Vad kostar matsvinnet i hemmet?* (ca 33 kg per person och år, 2022 års data) |
| 34 kg matsvinn per person och år, varav cirka 16 kg i soppåsen och resten i vasken (ca 18 kg) | Livsmedelsverket, *Konsumentundersökning matsvinn 2024* (2025); jfr *Matsvinn i hemmet 2022* (L 2023 nr 03) |
| 5 000–6 000 kr per år för en familj med två vuxna och två barn | Livsmedelsverket, *PM 2024 – Vad kostar matsvinnet i hemmet?* (ca 1 330 kr per person och år ≈ 5 300 kr för fyra personer) |

Obs! I underlaget stod det att "16 kg är fullt ätbar mat". Enligt Livsmedelsverket räknas **hela** matsvinnet
(34 kg) som mat som hade kunnat ätas. De ~16 kg är den del som hamnar i soppåsen, och resten hälls ut i
vasken. Filmen säger därför: *"Varav cirka 16 kg slängs i soppåsen – resten hälls ut i vasken."* Behöver
ni ändra formuleringen gör ni det i `src/config.ts`.

Länkar:
- https://livsmedelsverket.se/globalassets/publikationsdatabas/pm/2024/pm-2024-vad-kostar-matsvinnet-i-hemmet.pdf
- https://www.livsmedelsverket.se/496aa4/globalassets/publikationsdatabas/rapporter/2025/livsmedelsverkets-konsumentundersokning-matsvinn-2024.pdf
- https://www.livsmedelsverket.se/globalassets/publikationsdatabas/rapporter/2023/l-2023-nr-03-matsvinn-i-hemmet-2022.pdf
- https://www.naturvardsverket.se/data-och-statistik/avfall/avfall-mat/

## Musik

Musiken är originalkomponerad med kod i `scripts/make_audio.py`, så det finns inga licensproblem. Den går från
en mörk inledning i A-moll till en positiv puls i C-dur (100 BPM) när FreshFixer presenteras, och klippen
(t.ex. kylskåpsbytena) ligger på takten. Vill ni hellre använda licensierad musik ersätter ni
`public/audio/soundtrack.wav` med en fil på ca 90 sekunder.

## Globala målen

Ikonerna för mål 12 och 13 används enligt FN:s riktlinjer för informationsändamål.
