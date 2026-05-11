import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// slug format: "{logicalWidth}x{logicalHeight}@{dpr}x.png"
// e.g. "430x932@3x.png" → 1290×2796 physical pixels
function parseSlug(slug: string): { pw: number; ph: number } | null {
  const m = slug.match(/^(\d+)x(\d+)@(\d+(?:\.\d+)?)x\.png$/)
  if (!m) return null
  return {
    pw: Math.round(parseInt(m[1]) * parseFloat(m[3])),
    ph: Math.round(parseInt(m[2]) * parseFloat(m[3])),
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const dims = parseSlug(slug)
  if (!dims) return new Response('Not found', { status: 404 })

  const { pw, ph } = dims
  const iconSize = Math.round(Math.min(pw, ph) * 0.22)
  const fontSize = Math.round(iconSize * 0.24)

  return new ImageResponse(
    (
      <div
        style={{
          width: pw,
          height: ph,
          background: '#4e644f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Math.round(ph * 0.025),
        }}
      >
        {/* TownHelp house mark */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 192 192"
        >
          <polygon points="96,46 150,90 42,90" fill="white" />
          <rect x="52" y="88" width="88" height="64" rx="3" fill="white" />
          <rect x="61" y="99" width="19" height="17" rx="3" fill="#4e644f" />
          <rect x="112" y="99" width="19" height="17" rx="3" fill="#4e644f" />
          <path
            d="M83 152 L83 123 Q83 110 96 110 Q109 110 109 123 L109 152 Z"
            fill="#4e644f"
          />
          <circle cx="96" cy="44" r="9" fill="#f3dfce" />
          <circle cx="96" cy="44" r="5" fill="#6a5c4e" />
        </svg>

        <span
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize,
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          TownHelp
        </span>
      </div>
    ),
    { width: pw, height: ph }
  )
}
