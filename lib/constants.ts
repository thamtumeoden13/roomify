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
Photorealistic 3D floor plan, clean continuous surfaces, architectural masterpiece.

STRUCTURE & SURFACE CLEANUP:
- Precise wall extrusion from plan lines, consistent height, realistic materials.
- Seamless and continuous floor textures, clean empty floor spaces where labels used to be, strictly no 3D letters.
- Smooth polished flooring across the entire layout, ignoring all text and annotations from the input.

FURNITURE MAPPING:
- Realistic beds with linens, modern sofas, dining sets, full kitchen cabinetry.
- Porcelain bathroom fixtures, office desks, and minimal outdoor patio furniture.

STYLE & LIGHTING:
- Bright natural daylight, soft ambient occlusion shadows.
- High-end Octane render, Unreal Engine 5 aesthetic, 8k resolution, sharp details.
- Materials: Polished hardwood, marble tiles, matte white walls.
`.trim();

export const ROOMIFY_NEGATIVE_PROMPT = `
text, watermark, logo, letters, numbers, digits, dimensions, labels, 
3D typography, alphabet-shaped furniture, word-shaped objects, 
annotations, measurements, symbols, sketch, drawing, blurry, 
low quality, distorted, messy, perspective tilt, hand-drawn, 
paper texture, blueprints, black and white lines on floor.
`.trim();

export const ROOM_STYLES = [
    {
        id: "modern",
        name: "Modern",
        keywords: "modern minimalist interior, sleek lines, contemporary furniture, neutral color palette with bold accents, large windows, open space."
    },
    {
        id: "vintage",
        name: "Vintage",
        keywords: "vintage interior design, antique furniture, retro textures, warm color tones, ornate details, classic mid-century modern elements."
    },
    {
        id: "japandi",
        name: "Japandi",
        keywords: "japandi style, blend of Japanese minimalism and Scandinavian functionality, natural materials, light wood, clean lines, serene and calm atmosphere."
    },
    {
        id: "industrial",
        name: "Industrial",
        keywords: "industrial loft style, exposed brick, metal accents, concrete floors, large industrial windows, raw and unfinished look."
    }
];