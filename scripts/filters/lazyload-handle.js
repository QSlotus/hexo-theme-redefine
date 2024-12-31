'use strict'
hexo.extend.filter.register(
  'after_post_render',
  function (data) {
    const theme = hexo.theme.config;
    if (!theme.articles.lazyload || !theme.articles.lazyload) return;
    data.content = data.content.replace(
      // Match 'img' tags width the src attribute.
      /<img([^>]*)src="([^"]*)"([^>\/]*)\/?\s*>/gim,
      function (match, attrBegin, src, attrEnd) {
        
        // 如果图片有 data-no-lazyload="true" 属性，直接返回原标签
        if (attrBegin.includes('data-no-lazyload="true"') || attrEnd.includes('data-no-lazyload="true"')) {
          return match;
        }
    
        if (!src) return match;

        return `<img ${attrBegin}
                     lazyload
                     src="/images/loading.svg"
                     data-src="${src}"
                     ${attrEnd}
                >`
      }
    )
  },
  1
);
