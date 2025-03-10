function postEmoji(args) {
  if (args.length === 0) {
    return '';
  }

  const [category, name] = args[0].split('/');
  const options = args.slice(1).reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const scale = options.scale || 1;
  const width = options.width || 'auto'; // 支持自定义宽度
  const height = options.height || 'auto'; // 支持自定义高度

  const style = `
    transform: scale(${scale});
    display: inline-block;
    vertical-align: baseline; 
    cursor: default;
    width: ${width};
    height: ${height};
    object-fit: contain;
`;

// 添加一个包裹元素，并设置首个子元素的样式
return `<span style="display: inline-block; vertical-align: top;">
  <img src="https://s4.zstatic.net/npm/qiusyan-emojis@latest/${category}/${name}.png" data-no-preview="true" data-no-lazyload="true" style="${style}">
</span>`;
}

hexo.extend.tag.register('emoji', postEmoji);