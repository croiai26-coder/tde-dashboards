import { fontDisplay, ink } from "@/lib/theme";

export default function SectionHeader({
  title,
  dotColor,
  right,
  rightHref,
  small = false,
}: {
  title: string;
  dotColor: string;
  right?: string;
  rightHref?: string;
  small?: boolean;
}) {
  const size = small ? 18 : 22;
  const dot = small ? 8 : 9;
  const gap = small ? 9 : 10;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: small ? 12 : 14,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontWeight: 600,
          fontSize: size,
          color: ink.primary,
          display: "flex",
          alignItems: "center",
          gap,
        }}
      >
        <span
          style={{ width: dot, height: dot, borderRadius: "50%", background: dotColor }}
        />
        {title}
      </h2>
      {right &&
        (rightHref ? (
          <a href={rightHref} style={{ color: ink.faint, fontSize: 13 }}>
            {right}
          </a>
        ) : (
          <span style={{ color: ink.faint, fontSize: 13 }}>{right}</span>
        ))}
    </div>
  );
}
