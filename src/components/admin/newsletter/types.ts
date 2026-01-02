export type ContentType = 'news' | 'events' | 'statistics' | 'directives' | 'suggestions' | 'surveys' | 'gallery';

export interface NewsletterContent {
    id: string;
    type: ContentType;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
    is_published: boolean;
    published_at: string | null;
}

export interface NewsletterEdition {
    id: string;
    title: string;
    content: any;
    status: 'draft' | 'sent' | 'published';
    subscribers_count: number;
    created_at: string;
    sent_at: string | null;
    created_by: string | null;
    auto_generated: boolean;
}

export interface Subscriber {
    id: string;
    email: string;
    name: string | null;
    subscribed_at: string;
    is_active: boolean;
}
