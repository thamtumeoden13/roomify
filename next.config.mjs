/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'klyvifpieepniicfusan.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'replicate.delivery',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
