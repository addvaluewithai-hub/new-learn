# Chapter 9 classroom preview

Open `/?preview=book-ch09` after normal sign-in. Chapter 8 remains at
`/?preview=book-ch08`. Both use ReadingClassroom and authenticated Nova, with no
catalog release or progress writes.

## Source and delivery

The supplied scan `مسح المستندات٢٠٢٦١٠٠٩_٠٧٤٠٤٦.pdf` (SHA-256 in
`content/book-guided/physics-ch09/metadata.json`) contains printed pages 134–149
on PDF pages 12–19. The attachment ends at 149; this preview covers those pages
without assuming that this is the original book's chapter boundary.

41 short source portions preserve book order. Each reads the English excerpt
and its displayed equation before Egyptian Arabic explanation. Scientific
names remain English. The normal classroom presents seven original written
problems and twenty teacher-authored choice checks with gated feedback.

The optional scan reference follows the current portion and supports small,
half, full and hidden sizes. It starts hidden on mobile. It does not replace
the board or Nova. Question crops stop before printed solutions; the final
reflector figure supplies the object's speed without revealing calculations.

## Editorial decisions

Original quotations remain intact even where the book needs correction:

- Infrasound is below about 20 Hz; the printed 20–200 Hz range is incorrect.
- Ultrasound has no general upper limit of 100 kHz.
- Intensity is time-averaged energy flux, distinct from pressure amplitude.
- Transverse means perpendicular to propagation. Periodic need not mean sine.
- Refraction bending requires a speed change, and angles use the normal.
- Air–water reflection percentages describe that interface example.
- The ideal standing-wave model requires equal amplitudes and frequencies;
  boundary conditions select resonances in a bounded system.
- Significant diffraction also occurs for comparable wavelength and obstacle
  or opening size; “only much smaller” is too restrictive.
- A 3 dB difference gives about twice the intensity; −3 to +3 is 6 dB.
- The trumpet problem adds independent average intensities; the airplane
  problem assumes spherical free-field spreading.
- Pressure uses 330 m/s; the Doppler examples explicitly use the printed
  solution's 343 m/s. The reflector's 3.50 m/s comes from the source diagram.
- Observer and source Doppler signs are selected independently.

## Reproduction and verification

Render the supplied PDF with PyMuPDF at scale 1.5 and rotate 90 degrees
counterclockwise to `pdf-12.png` through `pdf-19.png`. Run:

```sh
python tools/crop-book-ch09.py --rasters /path/to/upright/rasters
npx prettier --write content/book-guided/physics-ch09
npm test
npm run build
npm run functions:check
npm run test:browser:book
```

Crop manifests retain raster names, original pixel rectangles and SHA-256
hashes. Browser verification walks both chapters at desktop and mobile widths,
checks source visibility, question gating, reference sizes and math layout,
and exercises Nova chat and controlled live transport. Controlled audio tests
do not constitute a human listening review.
