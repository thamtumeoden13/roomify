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
A stunning 3D architectural diorama visualization. 
3D STRUCTURE: Every wall must be a THICK, SOLID, WHITE MONOLITHIC block EXTRUDED upwards from the floor plan. Ensure clear 3D volume, realistic wall height, and deep spatial depth. 
FURNITURE: Every piece of furniture must be rendered as a solid 3D object with realistic weight, high-fidelity textures, and soft ambient occlusion shadows.
SURFACE CLEANUP: The floor is a continuous solid monolithic slab. COMPLETELY COVER and HIDE all text, lines, and labels from the original image with the selected flooring material.
QUALITY: Unreal Engine 5.4 render, 8k resolution, ray-tracing reflections, sharp architectural focus, cinematic photography style.
FINAL EXECUTION: Focus on 3D EXTRUSION. Walls must pop up from the ground. Ensure ultra-high textures for all surfaces.
`.trim();

export const ROOMIFY_NEGATIVE_PROMPT = `
text, words, letters, digits, numbers, labels, dimensions, 3d text, 3d letters, signage, typography, blurry, low quality, distorted, section view, side view, perspective distortion, messy floor, floor markings, architectural symbols, 
3D typography, alphabet-shaped furniture, word-shaped objects, floor decals, 
floor stickers, carpet patterns, rugs with text, messy grass, watermark, logo, annotations, measurements, drawing, distorted, perspective tilt, hand-drawn, paper texture, 
blueprints, black and white lines on floor, cluttered surfaces.
`.trim();

// 2. PHONG CÁCH NỘI THẤT (Định nghĩa vật liệu và đồ đạc)
export const ROOM_STYLES = [
    {
        id: "modern",
        name: "Modern",
        keywords: "ultra-modern minimalist interior, sleek architectural lines, bespoke contemporary furniture blocks, neutral color palette, large glass windows, expansive bright open space, flat uniform surfaces, absolute structural clarity."
    },
    {
        id: "vintage",
        name: "Vintage",
        keywords: "sophisticated vintage luxury, rich antique furniture textures, authentic hand-carved wood elements, warm classical tones, ornate architectural details, mid-century modern elegance, rich material depth, nostalgic atmospheric feel."
    },
    {
        id: "japandi",
        name: "Japandi",
        keywords: "premium japandi aesthetic, fusion of Japanese zen and Scandinavian functionality, organic natural wood solids, wabi-sabi textures, serene calm atmosphere, clean soft lines, clutter-free spatial volume."
    },
    {
        id: "industrial",
        name: "Industrial",
        keywords: "luxury industrial 3D loft, volumetric dark brick walls, refined black metal structural accents, polished monolithic concrete, factory-style steel windows, raw professional aesthetic, high-contrast material depth."
    }
];

// 3. VẬT LIỆU SÀN (Định nghĩa độ đặc và phản chiếu)
export const FLOORING_MATERIALS = [
    {
        id: "light-oak",
        name: "Light Oak",
        keywords: "solid opaque light oak timber planks, continuous natural wood grain, high-quality scandinavian hardwood flooring, seamless surface coverage, soft satin finish."
    },
    {
        id: "dark-walnut",
        name: "Dark Walnut",
        keywords: "premium opaque dark walnut hardwood, rich deep wood grain textures, polished heavy timber slabs, luxury seamless architectural flooring, sophisticated dark wood aesthetic."
    },
    {
        id: "polished-concrete",
        name: "Polished Concrete",
        keywords: "industrial solid polished gray concrete slab, seamless monolithic cement texture, architectural monolithic flooring, matte finish with realistic micro-textures."
    },
    {
        id: "white-marble",
        name: "White Marble",
        keywords: "luxury opaque white carrara marble, elegant gray veining, high-gloss solid stone surface, premium seamless marble tiles, reflective palace-grade finish."
    },
    {
        id: "hexagon-tiles",
        name: "Hexagon Tiles",
        keywords: "modern solid ceramic hexagon tiles, geometric 3D floor layout, opaque tile textures, clean architectural grouting, stylish designer flooring with depth."
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

