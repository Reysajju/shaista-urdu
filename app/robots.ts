import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/login', '/signup'],
        },
        sitemap: 'https://shaista.ai/sitemap.xml',
    }
}
