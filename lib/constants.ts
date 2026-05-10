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
Professional 3D architectural visualization, bird's-eye view, top-down orthographic plan. 
Photorealistic 3D floor plan, architectural masterpiece.
Clean monolithic white walls, seamless uniform flooring, professional studio lighting, soft natural shadows, high-end minimalist aesthetic.

STRUCTURE & SURFACE CLEANUP:
- Precise wall extrusion from plan lines, consistent height.
- Solid and uninterrupted floor textures across the entire layout.
- Strictly empty floor spaces, completely ignoring any text, labels, or annotations from the input image.
- Smooth polished architectural surfaces with no decals or floor markings.

FURNITURE MAPPING:
- Realistic furniture placement: beds with linens, modern sofas, dining sets, full kitchen cabinetry.
- Porcelain bathroom fixtures, professional office setups.

STYLE & LIGHTING:
- Bright natural daylighting, realistic ambient occlusion.
- High-end Octane render, Unreal Engine 5 aesthetic, 8k resolution, sharp professional visualization.
`.trim();

export const ROOMIFY_NEGATIVE_PROMPT = `
text, labels, letters, words, numbers, digits, dimensions, architectural symbols, 
3D typography, alphabet-shaped furniture, word-shaped objects, floor decals, 
floor stickers, carpet patterns, rugs with text, messy grass, distorted furniture,
watermark, logo, annotations, measurements, sketch, drawing, blurry, 
low quality, distorted, perspective tilt, hand-drawn, paper texture, 
blueprints, black and white lines on floor, cluttered surfaces.
`.trim();

export const ROOM_STYLES = [
    {
        id: "modern",
        name: "Modern",
        // Bổ sung "monolithic" và "seamless" để ép AI làm phẳng sàn
        keywords: "ultra-modern minimalist interior, monolithic seamless flooring, sleek lines, contemporary furniture, neutral color palette, large windows, bright open space, flat uniform surfaces."
    },
    {
        id: "vintage",
        name: "Vintage",
        keywords: "vintage interior design, antique furniture, retro textures, warm color tones, ornate details, classic mid-century modern elements, rich textures."
    },
    {
        id: "japandi",
        name: "Japandi",
        keywords: "japandi style, natural materials, light oak wood, clean lines, serene atmosphere, zen minimalism, organized space."
    },
    {
        id: "industrial",
        name: "Industrial",
        keywords: "industrial loft, exposed brick, metal accents, polished concrete floors, large windows, raw aesthetic."
    }
];

export const FLOORING_MATERIALS = [
    {
        id: "light-oak",
        name: "Light Oak",
        keywords: "light oak wood planks, natural wood grain, scandinavian timber"
    },
    {
        id: "dark-walnut",
        name: "Dark Walnut",
        keywords: "premium dark walnut hardwood, rich wood texture, polished timber"
    },
    {
        id: "polished-concrete",
        name: "Polished Concrete",
        keywords: "smooth polished concrete floor, industrial gray cement, seamless modern flooring"
    },
    {
        id: "white-marble",
        name: "White Marble",
        keywords: "luxury white carrara marble, elegant gray veining, high-gloss stone surface"
    },
    {
        id: "hexagon-tiles",
        name: "Hexagon Tiles",
        keywords: "modern hexagon ceramic tiles, geometric tile layout"
    }
];

export const LIGHTING_MOODS = [
    {
        id: "natural-daylight",
        name: "Natural Daylight",
        keywords: "bright natural sunlight, clear day lighting, realistic exterior light through windows",
        description: "Bright and clear daylight for a realistic feel"
    },
    {
        id: "golden-hour",
        name: "Golden Hour",
        keywords: "warm sunset glow, long soft shadows, cinematic orange hues, atmospheric lighting",
        description: "Warm, cinematic glow from the setting sun"
    },
    {
        id: "cozy-evening",
        name: "Cozy Evening",
        keywords: "warm indoor artificial lighting, soft lamps and recessed lights, intimate evening atmosphere",
        description: "Intimate atmosphere with warm indoor lights"
    },
    {
        id: "studio-white",
        name: "Studio White",
        keywords: "clean neutral white studio lighting, balanced shadows, professional architectural photography",
        description: "Neutral, balanced professional studio lighting"
    }
];

export const PROJECT_CONTEXTS = [
    {
        id: "residential",
        name: "Residential",
        description: "Standard home or apartment with a cozy, lived-in feel.",
        icon: "Home",
        keywords: "residential interior, cozy home atmosphere, domestic architecture"
    },
    {
        id: "luxury-real-estate",
        name: "Luxury Estate",
        description: "High-end finishes and premium architectural details.",
        icon: "Castle",
        keywords: "exquisite 3D architectural scale model, premium luxury finishes, high-end materials, sophisticated miniature detail, handcrafted diorama aesthetic"
    },
    {
        id: "commercial-office",
        name: "Office Space",
        description: "Professional workplace environment with commercial lighting.",
        icon: "Building",
        keywords: "modern office interior, commercial workplace, professional business environment"
    },
    {
        id: "retail-hospitality",
        name: "Retail & Cafe",
        description: "Public spaces like shops, restaurants, or cafes.",
        icon: "Store",
        keywords: "retail interior design, hospitality architecture, public commercial space"
    }
];

export const CAMERA_VIEWS = [
    {
        id: "plan",
        name: "Top-down (Plan)",
        keywords: "3D architectural floor plan, top-down orthographic visualization, flat 2D-to-3D conversion.",
        icon: "Square"
    },
    {
        id: "isometric",
        name: "Isometric (Angled)",
        // Thay "Model" và "Cutaway" để AI hiện cả cái nhà từ xa
        keywords: "A 3D dollhouse model of a house, 45 degree tilt, architectural diorama, miniature scale, visible wall height, floating on a white surface.",
        icon: "Box"
    },
    {
        id: "perspective",
        name: "Cinematic (Depth)", // Đổi tên để gợi ý về chiều sâu
        keywords: "A dramatic 3D perspective interior shot, camera tilted at a low angle looking INTO the rooms, extreme spatial depth, visible horizon line, vanishing point, high-end architectural photography, wide-angle lens, realistic room volume.",
        icon: "Video"
    }
];