import {heroImages} from './hero-data.js';
export function startHeroMotion(reduced){
 const hero=document.querySelector('.hero'),photos=[...hero.querySelectorAll('.hero-photo')];
 photos[0].src=heroImages[0];photos[1].src=heroImages[1];
 photos.forEach(p=>p.alt='Laser-cut wooden automotive craft preview');
 document.querySelector('#heroMotion').hidden=true;
 if(reduced)return;
 let current=0,front=0,onscreen=true;
 new IntersectionObserver(es=>onscreen=es[0].isIntersecting).observe(hero);
 setInterval(()=>{if(document.hidden||!onscreen)return;current=(current+1)%heroImages.length;const next=1-front;photos[next].src=heroImages[current];photos[next].classList.add('is-front');photos[front].classList.remove('is-front');front=next},7500);
}
