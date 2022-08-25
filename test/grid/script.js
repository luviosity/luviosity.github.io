const btn = document.querySelector('.more__btn');
const moreContent = document.querySelector('.more__content');

btn.addEventListener('click', function () {
  const style = moreContent.style;
  if (style.display) style.display = '';
  else style.display = 'block';
});
