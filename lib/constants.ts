// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// export const ROOMIFY_RENDER_PROMPT = `
// Professional architectural 3D plan visualization, bird's-eye view, top-down orthographic render.
// The output must be a clean, photorealistic 3D floor plan based exactly on the provided 2D layout.
//
// GEOMETRY & STRUCTURE:
// - Precisely extrude walls from the 2D plan lines with consistent height.
// - Realistic glass material for windows and clear openings for doors.
// - Perfectly aligned architectural elements, matching every dimension of the input floor plan.
//
// INTERIOR MAPPING & MATERIALS:
// - Floor: High-quality hardwood, polished marble, and ceramic tile textures.
// - Furniture: Replace 2D icons with realistic 3D assets: soft fabric sofas, wooden dining sets, modern kitchen cabinetry, sleek bathroom fixtures, and cozy beds with realistic linens.
// - Surfaces: Clean, matte-finished walls with subtle ambient occlusion shadows in corners.
//
// STYLE & LIGHTING:
// - Lighting: Bright, diffused natural daylight, soft shadows, high-end Octane render style, Unreal Engine 5 aesthetic.
// - Clarity: Sharp edges, 8k resolution, cinematic architectural photography, masterpiece, ultra-detailed.
//
// ENVIRONMENT:
// - Clean continuous surfaces, clutter-free, professional real estate presentation.
// `.trim();
export const ROOMIFY_RENDER_PROMPT = `
Professional architectural visualization diorama. 
3D EXTRUSION: Every wall must be a THICK, SOLID, MONOLITHIC architectural structure with precise 90-degree corners and significant depth. Walls should look like heavy physical slabs extruded upwards from the floor plan.
SURFACE CLEANUP: Aggressively overpaint and completely hide all 2D text, dimensions, labels, and original floor plan lines. Replace them with high-fidelity 3D surfaces and materials. Zero 2D artifacts.
LIGHTING & RENDERING: Physically Based Rendering (PBR), Global Illumination, Ray-traced reflections, Unreal Engine 5.4 Lumen render. Cinematic lighting with soft ambient occlusion and sharp architectural focus.
QUALITY: 8k UHD, masterpiece, photorealistic textures, hyper-realistic materials, high-end ArchViz photography style.
`.trim();

export const ROOMIFY_NEGATIVE_PROMPT = `
text, words, letters, digits, numbers, labels, dimensions, 3d text, 3d letters, signage, typography, watermark, logo, annotations, measurements, 
warped walls, floating furniture, ghosting text, overlapping rooms, distorted perspectives, "alphabet-shaped" furniture, 
blurry, low quality, distorted, section view, side view, perspective distortion, messy floor, floor markings, architectural symbols, 
3D typography, word-shaped objects, floor decals, floor stickers, carpet patterns, rugs with text, messy grass, 
drawing, distorted, perspective tilt, hand-drawn, paper texture, blueprints, black and white lines on floor, cluttered surfaces.
`.trim();

// 2. PHONG CÁCH NỘI THẤT (Định nghĩa vật liệu và đồ đạc)
export const ROOM_STYLES = [
    {
        id: "modern",
        name: "Modern",
        keywords: "ultra-modern minimalist luxury, sleek architectural lines, bespoke contemporary furniture, neutral high-end color palette, expansive bright open space, flat uniform surfaces, absolute structural clarity, high-end Italian furniture design."
    },
    {
        id: "vintage",
        name: "Vintage",
        keywords: "sophisticated heritage luxury, rich antique mahogany and oak textures, authentic hand-carved wood elements, warm classical tones, ornate architectural crown molding, mid-century modern elegance, rich material depth, nostalgic atmospheric feel."
    },
    {
        id: "japandi",
        name: "Japandi",
        keywords: "premium japandi aesthetic, fusion of Japanese zen and Scandinavian functionality, organic natural white oak and cedar solids, wabi-sabi textures, serene calm atmosphere, clean soft lines, clutter-free spatial volume, tatami influences."
    },
    {
        id: "industrial",
        name: "Industrial",
        keywords: "luxury industrial 3D loft, volumetric weathered brick walls, refined black powder-coated metal structural accents, polished monolithic concrete, factory-style steel windows, raw professional aesthetic, high-contrast material depth, exposed structural beams."
    }
];

// 3. VẬT LIỆU SÀN (Định nghĩa độ đặc và phản chiếu)
export const FLOORING_MATERIALS = [
    {
        id: "light-oak",
        name: "Light Oak",
        keywords: "solid opaque light oak timber planks, micro-texture detail, specular highlights, continuous natural wood grain, high-quality scandinavian hardwood, seamless tiling, soft satin finish."
    },
    {
        id: "dark-walnut",
        name: "Dark Walnut",
        keywords: "premium opaque dark walnut hardwood, rich deep wood grain textures, specular highlights, polished heavy timber slabs, luxury seamless architectural tiling, sophisticated dark wood aesthetic."
    },
    {
        id: "polished-concrete",
        name: "Polished Concrete",
        keywords: "industrial solid polished gray concrete slab, seamless monolithic cement texture, specular reflections, architectural monolithic flooring, matte finish with realistic micro-textures."
    },
    {
        id: "white-marble",
        name: "White Marble",
        keywords: "luxury opaque white carrara marble, elegant gray veining, high-gloss solid stone surface, specular reflections, premium seamless marble tiling, reflective palace-grade finish."
    },
    {
        id: "hexagon-tiles",
        name: "Hexagon Tiles",
        keywords: "modern solid ceramic hexagon tiles, geometric 3D floor layout, opaque tile textures, clean architectural grouting, stylish designer flooring with depth, seamless tiling patterns."
    }
];

// 4. ÁNH SÁNG (Định nghĩa bóng đổ và hiệu ứng không gian)
export const LIGHTING_MOODS = [
    {
        id: "natural-daylight",
        name: "Natural Daylight",
        keywords: "fresh early morning bright natural sunlight, clear day lighting through large windows, realistic exterior illumination, balanced soft shadows, airy and vibrant atmosphere.",
        description: "Bright and clear daylight for a realistic feel"
    },
    {
        id: "golden-hour",
        name: "Golden Hour",
        keywords: "cinematic warm sunset orange glow, dramatic 45-degree long shadows, volumetric sun rays, peaceful luxury mood, golden atmospheric lighting, high-contrast sunset feel.",
        description: "Warm, cinematic glow from the setting sun"
    },
    {
        id: "cozy-evening",
        name: "Cozy Evening",
        keywords: "intimate evening artificial lighting, warm indoor designer lamps, soft recessed ceiling glow, moody interior atmosphere, warm amber hues, realistic domestic tranquility.",
        description: "Intimate atmosphere with warm indoor lights"
    },
    {
        id: "studio-white",
        name: "Studio White",
        keywords: "professional neutral white studio lighting, clinical clarity, high-key architectural photography lighting, clean balanced shadows, focus on material details and sharp edges.",
        description: "Neutral, balanced professional studio lighting"
    }
];

// 5. NGỮ CẢNH DỰ ÁN (Định nghĩa bối cảnh tổng thể)
export const PROJECT_CONTEXTS = [
    {
        id: "residential",
        name: "Residential",
        icon: "Home",
        keywords: "high-end residential apartment model, cozy domestic living environment, realistic home architectural visualization, premium urban lifestyle."
    },
    {
        id: "luxury-real-estate",
        name: "Luxury Estate",
        icon: "Castle",
        keywords: "exquisite 3D luxury villa scale model, mansion-grade finishes, high ceilings, expansive premium spaces, sophisticated elite architectural visualization."
    },
    {
        id: "commercial-office",
        name: "Office Space",
        icon: "Building",
        keywords: "modern corporate workplace model, professional business environment, high-tech office architecture, sleek productive atmosphere, commercial lighting."
    },
    {
        id: "retail-hospitality",
        name: "Retail & Cafe",
        icon: "Store",
        keywords: "boutique retail 3D model, hospitality architecture diorama, stylish commercial public space, designer shop aesthetic, high-end cafe visualization."
    }
];

// 6. GÓC NHÌN CAMERA
export const CAMERA_VIEWS = [
    {
        id: "plan",
        name: "Top-down (Plan)",
        // Tập trung vào 90 độ và nhìn thẳng
        keywords: "straight down 90-degree overhead shot, 3D orthographic floor plan, vertical architectural projection, no camera tilt."
    },
    {
        id: "isometric",
        name: "Isometric (Angled)",
        // Tập trung vào độ nghiêng 45 độ và sa bàn
        keywords: "45-degree angled camera tilt-shift, physical 3D diorama aesthetic, visible wall thickness and spatial volume."
    }
];

export const ROOMIFY_INPAINT_PROMPT = `
seamlessly blend the new texture with the surrounding 3D environment, match lighting and shadows, high-fidelity integration, ArchViz standard, physically based rendering.
`.trim();

