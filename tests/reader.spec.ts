import {test,expect} from '@playwright/test';

for (const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]) {
  test(`biblioteca ${viewport.name} es responsive y limpia`,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text())});
    await page.goto('/');
    await expect(page.getByText('Mi biblioteca')).toBeVisible();
    await expect(page.getByText('TU ESPACIO DE LECTURA')).toHaveCount(0);
    await expect(page.getByText('Lee sin límites.')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Importar PDF'})).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    expect(errors).toEqual([]);
  });
}

test('reader exposes text-only controls and no PDF renderer',async({page})=>{
  await page.goto('/');
  await expect(page.locator('input[type=file]')).toHaveAttribute('accept','application/pdf');
  await expect(page.getByRole('button',{name:/zoom/i})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Lectura'})).toHaveCount(0);
});

test('libro legado sin pages muestra recuperación sin pageerror',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*.js',route=>route.abort());
  await page.goto('/');
  await page.evaluate(async()=>{await new Promise<void>((resolve,reject)=>{const remove=indexedDB.deleteDatabase('bookpoor');remove.onerror=()=>reject(remove.error);remove.onblocked=()=>reject(new Error('IndexedDB cleanup was blocked'));remove.onsuccess=()=>{const request=indexedDB.open('bookpoor',1);request.onupgradeneeded=()=>request.result.createObjectStore('books',{keyPath:'id',autoIncrement:true});request.onsuccess=()=>{const db=request.result;const add=db.transaction('books','readwrite').objectStore('books').add({name:'Libro legado',size:1,addedAt:Date.now(),progress:0,page:1,fontSize:18,lineHeight:1.7,theme:'light'});add.onsuccess=()=>{db.close();resolve()};add.onerror=()=>{db.close();reject(add.error)}};request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('IndexedDB seed was blocked'))}});});
  await page.unroute('**/*.js');
  await page.reload();
  await page.getByText('Libro legado').click();
  await expect(page.getByText('Este libro debe importarse nuevamente')).toBeVisible();
  expect(errors).toEqual([]);
});

test('lector móvil ofrece toolbar y persiste preferencias',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/sample.pdf');
  await expect(page.getByRole('status')).toContainText('Extrayendo texto');
  await expect(page.getByText('sample.pdf')).toBeVisible({timeout:15000});
  await page.getByText('sample.pdf').click();
  await expect(page.getByRole('navigation',{name:'Controles del lector'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Cambiar a tema/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Marcar'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ajustes'})).toBeVisible();
  await page.getByRole('button',{name:'Ajustes'}).click();
  await page.getByLabel('Interlineado').selectOption('2');
  await page.getByLabel('Ancho de lectura').selectOption('wide');
  await page.getByRole('button',{name:'Cerrar ajustes'}).click();
  await page.getByRole('button',{name:/Cambiar a tema oscuro/}).click();
  await page.getByRole('button',{name:'Marcar'}).click();
  await page.getByRole('button',{name:'Aumentar tamaño de texto'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});

test('importa PDF real, extrae bloques semánticos y persiste tras recargar',async({page})=>{
  const failures:string[]=[];
  page.on('pageerror',error=>failures.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error'&&/worker|pdf|pdfjs/i.test(message.text()))failures.push(`console: ${message.text()}`)});
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/sample.pdf');
  await expect(page.getByRole('status')).toContainText('Extrayendo texto');
  await expect(page.getByText('sample.pdf')).toBeVisible({timeout:15000});
  await page.getByText('sample.pdf').click();
  await expect(page.locator('article h2')).toContainText('Imported PDF title');
  await expect(page.locator('article p')).toContainText('A paragraph from PDF.');
  await page.getByRole('button',{name:'Cerrar lector'}).click();
  await page.reload();
  await page.getByText('sample.pdf').click();
  await expect(page.locator('article h2')).toContainText('Imported PDF title');
  expect(failures).toEqual([]);
});
