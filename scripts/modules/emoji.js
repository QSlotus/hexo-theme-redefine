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
  const style = `transform: scale(${scale}); display: inline-block; vertical-align: middle; cursor: default;`
  return `<img src="https://s4.zstatic.net/npm/qiusyan-emojis@latest/${category}/${name}.png" data-no-preview="true" data-no-lazyload="true" style="${style}">`;
}

hexo.extend.tag.register('emoji', postEmoji);