import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Servosteel — Roll Form, Rulo Dilme ve Boy Kesme Hatları";

const TITLE = "Roll Form, Rulo Dilme ve Boy Kesme Hatları";
const TAGLINE = "İstanbul'dan 48+ ülkeye ihracat";
const BRAND = "Servosteel";
const SUB = "Pres Besleme Sistemleri";
const URL_TEXT = "servosteel.com.tr";

/* Google Fonts'tan yalnızca kullanılan karakterleri içeren TTF alt kümesini indirir
   (Satori woff2 okuyamadığı için truetype ister) */
async function loadGoogleFont(family: string, weight: number, text: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/
  );
  if (resource) {
    const res = await fetch(resource[1]);
    if (res.ok) return res.arrayBuffer();
  }
  throw new Error(`${family} fontu yüklenemedi`);
}

export default async function OgImage() {
  const text = [TITLE, TAGLINE, BRAND, SUB, URL_TEXT].join("");
  const montserrat = await loadGoogleFont("Montserrat", 700, text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0c0e",
          padding: "64px",
          fontFamily: "Montserrat",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dilinmiş sac şeritleri */}
        <div
          style={{
            position: "absolute",
            right: -140,
            top: 96,
            width: 640,
            height: 26,
            background: "#e7a300",
            transform: "rotate(-14deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            top: 168,
            width: 640,
            height: 26,
            background: "#3a3b40",
            transform: "rotate(-14deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            top: 240,
            width: 640,
            height: 26,
            background: "#232428",
            transform: "rotate(-14deg)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, color: "#ffffff" }}>
            <span style={{ color: "#e7a300" }}>Servo</span>
            <span>steel</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#c8c8c8", marginTop: 4 }}>
            {SUB}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 46,
              color: "#ffffff",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            {TITLE}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", width: 46, height: 4, background: "#e7a300" }} />
            <div style={{ display: "flex", fontSize: 26, color: "#e7a300" }}>
              {TAGLINE}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#c8c8c8" }}>
            {URL_TEXT}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Montserrat", data: montserrat, weight: 700, style: "normal" },
      ],
    }
  );
}
