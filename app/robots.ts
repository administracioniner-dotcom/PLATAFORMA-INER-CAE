import type { MetadataRoute } from "next";

/** Portal privado: no debe indexarse. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
