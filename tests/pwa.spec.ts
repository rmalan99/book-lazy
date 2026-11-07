import {test,expect} from '@playwright/test';

test('manifiesto e iconos PWA son válidos',async({page,request})=>{
  await page.goto('/');
  const manifest=await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const data=await manifest.json();
  expect(data).toMatchObject({name:'Bookpoor — tu biblioteca local',short_name:'Bookpoor',id:'/',start_url:'/',scope:'/',display:'standalone',orientation:'portrait-primary'});
  for(const icon of data.icons){const response=await request.get(icon.src);expect(response.ok()).toBeTruthy();expect(response.headers()['content-type']).toContain('image/png')}
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href','/apple-touch-icon.png');
});

test('service worker controla la app tras cargar producción',async({page})=>{
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker?.controller?.scriptURL ?? '')).toContain('/sw.js');
});

test('instalación responde al evento controlado y no aparece por defecto',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Instalar aplicación'})).toHaveCount(0);
  await page.evaluate(()=>window.dispatchEvent(Object.assign(new Event('beforeinstallprompt',{cancelable:true}),{prompt:async()=>{},userChoice:Promise.resolve({outcome:'dismissed'})})));
  await expect(page.getByRole('button',{name:'Instalar aplicación'})).toBeVisible();
});
