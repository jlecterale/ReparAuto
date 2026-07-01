import React from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme";
import { brandFont } from "../fonts";

/**
 * App-style listing card used across feature scenes to evoke the real product.
 * Kept purely presentational; animation is applied by the caller.
 */
export const ListingCard: React.FC<{
  image: string;
  title: string;
  subtitle: string;
  price: string;
  tag?: string;
  tagColor?: string;
  width?: number;
}> = ({
  image,
  title,
  subtitle,
  price,
  tag,
  tagColor = colors.success,
  width = 620,
}) => {
  return (
    <div
      style={{
        width,
        background: colors.white,
        borderRadius: 36,
        overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
        fontFamily: brandFont,
      }}
    >
      <div style={{ position: "relative", height: width * 0.62 }}>
        <Img
          src={staticFile(image)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {tag ? (
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 24,
              background: tagColor,
              color: colors.white,
              fontWeight: 700,
              fontSize: 30,
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
      <div style={{ padding: "30px 36px 38px" }}>
        <div style={{ fontWeight: 800, fontSize: 44, color: colors.ink }}>
          {title}
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 32,
            color: "#6c6e72",
            marginTop: 6,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 52,
            color: colors.primaryDark,
            marginTop: 20,
          }}
        >
          {price}
        </div>
      </div>
    </div>
  );
};
