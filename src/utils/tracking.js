export const trackProductView = (product) => console.log('Tracking product view:', product);
export const trackSearch = (query, count) => console.log('Tracking search:', query, count);
export const trackCartAction = (action, product, quantity) => console.log('Tracking cart action:', action, product, quantity);
export const trackCategoryView = (category, count) => console.log('Tracking category view:', category, count);
export const trackGenderView = (gender, count) => console.log('Tracking gender view:', gender, count);
export const trackStyleView = (styles, count) => console.log('Tracking style view:', styles, count);