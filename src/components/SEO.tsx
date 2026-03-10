import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    url?: string;
    ogType?: 'website' | 'article';
}

/**
 * Reusable SEO Component using react-helmet-async.
 * It automatically uses the current language to set the `lang` and `dir` attributes,
 * and falls back to i18n translations if specific props aren't provided.
 */
const SEO = ({ title, description, keywords, url = window.location.href, ogType = 'website' }: SEOProps) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'en';
    const isRtl = lang === 'he';

    // Fallback defaults using i18n
    const defaultTitle = t('app.title', 'Cessna 172 IL Pilot tools');
    const defaultDescription = t('app.description', 'Pilot tools and performance calculators for the Cessna 172 in Israel.');
    const defaultKeywords = 'Cessna 172, aviation, performance, weight and balance, navigation, flight planning, Israel, C172, NOTAM, AVIATION WEATHER, LLHZ, שדה התעופה הרצליה';

    const finalTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;

    return (
        <Helmet htmlAttributes={{ lang, dir: isRtl ? 'rtl' : 'ltr' }}>
            {/* Standard Metadata */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <meta name="theme-color" content="#1e3a8a" />
            <link rel="canonical" href={url} />

            {/* Open Graph / Social Media Metadata */}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={url} />

            {/* Twitter Summary Card */}
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
        </Helmet>
    );
};

export default SEO;
