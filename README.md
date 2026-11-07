# FreshFix UF – reklamfilm för Alumninästet 2026

Färdig film: **`out/FreshFix_Alumninastet2026_1080p.mp4`** (16:9, 1920×1080, 30 fps, H.264 + AAC, exakt 60 s).

Filmen byggs med [Remotion](https://www.remotion.dev) (React → video). Alla texter, färger och tider ligger i
två filer, så ni kan ändra filmen utan att röra animationerna.

## Snabbstart

```bash
npm install
npm run studio        # förhandsgranska och skrubba i webbläsaren
npm run render        # → out/FreshFix_Alumninastet2026_1080p.mp4
npm run render:4k     # → out/FreshFix_Alumninastet2026_4K.mp4 (3840×2160)
```

## Musik: "So Fresh, So Clean" (instrumental)

Filmen är klippt i **taktslag**: varje scen, övergång och textslag ligger på ett slag i musiken.
Scenplanen finns (i taktslag) i `scripts/sync_music.py`, som räknar ut `src/timeline.json`.
Just nu är filmen synkad till 83 BPM (tempot som anges för originalinspelningen) med ett tillfälligt
genererat musikspår.

Så lägger ni in låten:

```bash
pip install numpy scipy pillow opencv-python-headless
# 1. Lägg instrumentalfilen i assets/source/, t.ex. assets/source/so_fresh_so_clean_instrumental.mp3
# 2. Mät tempo + första slag och synka alla klipp mot låten:
npm run sync -- assets/source/so_fresh_so_clean_instrumental.mp3
#    (blir mätningen fel: lägg till --bpm 83 och/eller --start <sekund i låten där filmen ska börja>,
#     eller --skip-bars 4 för att hoppa över låtens intro)
# 3. Mixa låten med ljudeffekterna och rendera:
npm run audio && npm run render
```

Filmen blir aldrig längre än 60 sekunder (vid snabbare tempo blir den något kortare).
Obs! Låten är upphovsrättsskyddad (OutKast). Det går bra att använda den i en ansökan som bara juryn ser,
men om filmen publiceras offentligt kan ljudet blockeras.

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
  sync_music.py           ★ Scenplan i taktslag + tempomätning av er låt → timeline.json
  make_audio.py           Mixar låten (eller reservmusik) med ljudeffekterna efter timeline.json
src/
  config.ts               ★ ALLA TEXTER OCH FÄRGER
  timeline.json           Tider i sekunder – GENERERAS av scripts/sync_music.py (scenplan i taktslag)
  FreshFixFilm.tsx        Lägger scenerna i följd + ljudspåret
  scenes/S1Problem.tsx    Scen 1 – Problemet: matsvinnet
  scenes/S2Facts.tsx      Scen 2 – Fakta (med källhänvisningar)
  scenes/S3Solution.tsx   Scen 3 – "Vi presenterar FreshFixer"
  scenes/S4How.tsx        Scen 4 – Aktivt kol, zeolit, filterpåsen, montering
  scenes/S6Sustain.tsx    Scen 5 – Hållbarhet
  scenes/S7Why.tsx        Scen 6 – Varför FreshFix UF?
  scenes/S8Finale.tsx     Scen 7 – Avslut, logotyp och uppmaning
  components/             Gemensamma delar (typografi, produktfoto, logotyp, partiklar, linjegrafik)
docs/speakermanus.md      Manus + tider för svensk speakerröst
```

## Om produktbilderna

FreshFixer visas **endast med era egna, hela studiofoton och klipp**. Inga bilder är frilagda eller
genererade, och kameran rör sig bara över de riktiga fotona. Därför är form, hål, slitsar och gravyr
exakt som i verkligheten. Logotypen är er riktiga logga (`assets/source/logo.jpg`), gjord vit/transparent.

Kol- och zeolitgranulerna och linjegrafiken i inledningen är skapade med kod (inte stockfilm).

## Speakerröst

Filmen har ingen speakerröst. Vill ni lägga till en kan den genereras lokalt med Piper (`npm run voice`,
se `scripts/make_voiceover.py`) eller spelas in enligt manuset nedan.

Manus med tider finns i `docs/speakermanus.md`. Lägg inspelningen som `public/audio/voiceover.wav`
och kör `npm run audio && npm run render`. Rösten mixas in och musiken sänks automatiskt under den.

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

## Reservmusik

Om ingen låt anges genererar `scripts/make_audio.py` ett eget, licensfritt spår i samma tempo: en mörk
inledning som övergår i en positiv puls när FreshFixer presenteras.

## Globala målen

Ikonerna för mål 12 och 13 används enligt FN:s riktlinjer för informationsändamål.
