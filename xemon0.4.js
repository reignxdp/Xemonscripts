// ==UserScript==
// @name         Xemon Pixel Bot / v0.4
// @name:en      Xemon Pixel Bot / v0.4
// @description  Automatic Pixel Bot
// @version      0.4.0
// @author       Reign & Kutsal Balik
// @match        https://pixelplanet.fun/*
// @match        https://pixmap.fun/*
// @match        https://pixelya.fun/*
// @match        https://pxuniverse.fun/*
// @match        https://pixeldays.xyz/*
// @match        https://pixarea.fun/*
// @match        *://*.gplace.xyz/*
// @match        *://*.canvasland.net/*
// @match        *://*.pixworld.net/*
// @grant        none
// @license      MIT
// @namespace    http://tampermonkey.net/
// @downloadURL  https://update.greasyfork.org/scripts/569713/Xemon%20Pixel%20Bot%20%20v04.user.js
// @updateURL    https://update.greasyfork.org/scripts/569713/Xemon%20Pixel%20Bot%20%20v04.meta.js
// ==/UserScript==

(function() {
    'use strict';

    let baglanti = null;
    let calisiyor = false;
    let pixelKuyrugu = [];
    let sira = 0;
    let baslangicX = 0,
        baslangicY = 0;
    let yuklenenResim = null;
    let zamanlayici = null;
    let beklemeZamanlayici = null;
    let rastgeleTiklamaZamanlayici = null;
    let rastgeleSira = [];
    let bolgeSira = [];
    let caprazSira = [];
    let yilanSira = [];
    let halkaSira = [];
    let yayilmaSira = [];

    let tikSayisi = 0;
    let bekliyor = false;
    let istatistik = {
        atilan: 0,
        baslamaZamani: null
    };

    let aktifSekme = 'main';
    let mod = 'sequential';
    let gecikmeMs = 1000;
    let antiBotAcik = false;

    const site = window.location.host;
    const ppfMi = site.includes('pixelplanet');
    const pxuMi = site.includes('pxuniverse');
    const pixmapMi = site.includes('pixmap');
    const pixelyaMi = site.includes('pixelya');
    const pixeldaysMi = site.includes('pixeldays');
    const gplaceMi = site.includes('gplace');
    const pixareaMi = site.includes('pixarea');

    let partiBoyutu = 80;
    let beklemeSuresiMs = 40000;

    if (ppfMi) {
        partiBoyutu = 5;
        beklemeSuresiMs = 60000;
    } else if (pixelyaMi) {
        partiBoyutu = 500;
        beklemeSuresiMs = 500000;
    } else if (pixmapMi) {
        partiBoyutu = 60;
        beklemeSuresiMs = 60000;
    } else if (pxuMi) {
        partiBoyutu = 100;
        beklemeSuresiMs = 100000;
    } else if (pixeldaysMi) {
        partiBoyutu = 60;
        beklemeSuresiMs = 60000;
    } else if (gplaceMi) {
        partiBoyutu = 60;
        beklemeSuresiMs = 60000;
    } else if (pixareaMi) {
        partiBoyutu = 60;
        beklemeSuresiMs = 60000;
    }

    const renkPaleti = {
        2: [255, 255, 255],
        3: [200, 200, 200],
        4: [128, 128, 128],
        5: [64, 64, 64],
        6: [32, 32, 32],
        7: [0, 0, 0],
        8: [255, 200, 220],
        9: [255, 180, 200],
        10: [255, 150, 180],
        11: [255, 100, 100],
        12: [255, 0, 0],
        13: [180, 0, 0],
        14: [255, 200, 100],
        15: [255, 128, 0],
        16: [180, 100, 50],
        17: [139, 69, 19],
        18: [210, 180, 140],
        19: [255, 255, 150],
        20: [255, 255, 0],
        21: [150, 255, 150],
        22: [0, 255, 0],
        23: [0, 180, 0],
        24: [0, 100, 0],
        25: [100, 255, 255],
        26: [100, 200, 255],
        27: [100, 150, 255],
        28: [0, 0, 255],
        29: [0, 0, 180],
        30: [200, 150, 255],
        31: [128, 0, 255]
    };

    function renkBul(r, g, b) {
        let enYakin = Infinity,
            enYakinId = 7;
        for (const [id, rgb] of Object.entries(renkPaleti)) {
            const uzaklik = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
            if (uzaklik < enYakin) {
                enYakin = uzaklik;
                enYakinId = parseInt(id);
            }
        }
        return enYakinId;
    }

    function tikla(x, y) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        const dikdortgen = canvas.getBoundingClientRect();
        const olcekX = canvas.width / dikdortgen.width;
        const olcekY = canvas.height / dikdortgen.height;
        let xKonum, yKonum;

        if (x === 'rastgele') {
            xKonum = dikdortgen.left + Math.random() * dikdortgen.width;
            yKonum = dikdortgen.top + Math.random() * dikdortgen.height;
        } else {
            xKonum = dikdortgen.left + (x * olcekX / canvas.width) * dikdortgen.width;
            yKonum = dikdortgen.top + (y * olcekY / canvas.height) * dikdortgen.height;
        }

        const olaylar = ['mousedown', 'mouseup', 'click'];
        olaylar.forEach(olayTipi => {
            const olay = new MouseEvent(olayTipi, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: xKonum,
                clientY: yKonum,
                button: 0
            });
            canvas.dispatchEvent(olay);
        });
        return true;
    }

    function rastgeleTiklamaYap() {
        if (!calisiyor) return;
        if (ppfMi || pixareaMi) return;
        tikla('rastgele', 'rastgele');
        logEkle(`Rastgele tiklandi`);
    }

    function rastgeleTiklamaBaslat() {
        if (ppfMi || pixareaMi) return;
        if (rastgeleTiklamaZamanlayici) clearInterval(rastgeleTiklamaZamanlayici);
        rastgeleTiklamaZamanlayici = setInterval(() => {
            rastgeleTiklamaYap();
        }, 10000);
    }

    function rastgeleTiklamaDurdur() {
        if (rastgeleTiklamaZamanlayici) {
            clearInterval(rastgeleTiklamaZamanlayici);
            rastgeleTiklamaZamanlayici = null;
        }
    }

    async function resimYukle(dosya, xBaslangic, yBaslangic) {
        return new Promise((tamam, hata) => {
            const resim = new Image();
            const okuyucu = new FileReader();
            okuyucu.onload = function(e) {
                resim.onload = function() {
                    const tuval = document.createElement('canvas');
                    tuval.width = resim.width;
                    tuval.height = resim.height;
                    const cizim = tuval.getContext('2d');
                    cizim.drawImage(resim, 0, 0);
                    const resimVerisi = cizim.getImageData(0, 0, resim.width, resim.height);
                    const veri = resimVerisi.data;
                    const kuyruk = [];
                    for (let y = 0; y < resim.height; y++) {
                        for (let x = 0; x < resim.width; x++) {
                            const idx = (y * resim.width + x) * 4;
                            const r = veri[idx],
                                g = veri[idx + 1],
                                b = veri[idx + 2],
                                a = veri[idx + 3];
                            if (a < 128) continue;
                            const renkId = renkBul(r, g, b);
                            kuyruk.push({
                                x: xBaslangic + x,
                                y: yBaslangic + y,
                                renk: renkId
                            });
                        }
                    }
                    tamam(kuyruk);
                };
                resim.onerror = hata;
                resim.src = e.target.result;
            };
            okuyucu.onerror = hata;
            okuyucu.readAsDataURL(dosya);
        });
    }

    function karistir(dizi) {
        for (let i = dizi.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
        }
        return dizi;
    }

    function bolgeSirasiOlustur(toplam) {
        const boyut = Math.ceil(Math.sqrt(toplam));
        const sira = [];
        for (let bolgeY = 0; bolgeY < boyut; bolgeY++) {
            for (let bolgeX = 0; bolgeX < boyut; bolgeX++) {
                for (let y = 0; y < Math.ceil(toplam / boyut); y++) {
                    for (let x = 0; x < Math.ceil(toplam / boyut); x++) {
                        const idx = (bolgeY * boyut + bolgeX) * (Math.ceil(toplam / boyut) * Math.ceil(toplam / boyut)) + (y * Math.ceil(toplam / boyut) + x);
                        if (idx < toplam) sira.push(idx);
                    }
                }
            }
        }
        return sira;
    }

    function caprazSirasiOlustur(genislik, yukseklik) {
        const sira = [];
        for (let s = 0; s < genislik + yukseklik - 1; s++) {
            for (let y = 0; y < yukseklik; y++) {
                let x = s - y;
                if (x >= 0 && x < genislik) {
                    sira.push(y * genislik + x);
                }
            }
        }
        return sira;
    }

    function yilanSirasiOlustur(genislik, yukseklik) {
        const sira = [];
        for (let y = 0; y < yukseklik; y++) {
            if (y % 2 === 0) {
                for (let x = 0; x < genislik; x++) {
                    sira.push(y * genislik + x);
                }
            } else {
                for (let x = genislik - 1; x >= 0; x--) {
                    sira.push(y * genislik + x);
                }
            }
        }
        return sira;
    }

    function halkaSirasiOlustur(genislik, yukseklik) {
        const sira = [];
        const toplam = genislik * yukseklik;
        const ziyaretEdildi = new Array(toplam).fill(false);
        let katmanlar = Math.ceil(Math.min(genislik, yukseklik) / 2);

        for (let katman = 0; katman < katmanlar; katman++) {
            let ust = katman;
            let alt = yukseklik - 1 - katman;
            let sol = katman;
            let sag = genislik - 1 - katman;

            for (let x = sol; x <= sag; x++) {
                let idx = ust * genislik + x;
                if (!ziyaretEdildi[idx]) {
                    ziyaretEdildi[idx] = true;
                    sira.push(idx);
                }
            }
            for (let y = ust + 1; y <= alt; y++) {
                let idx = y * genislik + sag;
                if (!ziyaretEdildi[idx]) {
                    ziyaretEdildi[idx] = true;
                    sira.push(idx);
                }
            }
            if (ust < alt) {
                for (let x = sag - 1; x >= sol; x--) {
                    let idx = alt * genislik + x;
                    if (!ziyaretEdildi[idx]) {
                        ziyaretEdildi[idx] = true;
                        sira.push(idx);
                    }
                }
            }
            if (sol < sag) {
                for (let y = alt - 1; y > ust; y--) {
                    let idx = y * genislik + sol;
                    if (!ziyaretEdildi[idx]) {
                        ziyaretEdildi[idx] = true;
                        sira.push(idx);
                    }
                }
            }
        }
        return sira;
    }

    function yayilmaSirasiOlustur(genislik, yukseklik, basX = 0, basY = 0) {
        const sira = [];
        const toplam = genislik * yukseklik;
        const ziyaretEdildi = new Array(toplam).fill(false);
        const kuyruk = [{
            x: basX,
            y: basY
        }];
        let idx = basY * genislik + basX;
        ziyaretEdildi[idx] = true;
        sira.push(idx);

        while (kuyruk.length > 0) {
            const anlik = kuyruk.shift();
            const komsular = [{
                    x: anlik.x + 1,
                    y: anlik.y
                },
                {
                    x: anlik.x - 1,
                    y: anlik.y
                },
                {
                    x: anlik.x,
                    y: anlik.y + 1
                },
                {
                    x: anlik.x,
                    y: anlik.y - 1
                }
            ];
            for (const k of komsular) {
                if (k.x >= 0 && k.x < genislik && k.y >= 0 && k.y < yukseklik) {
                    idx = k.y * genislik + k.x;
                    if (!ziyaretEdildi[idx]) {
                        ziyaretEdildi[idx] = true;
                        sira.push(idx);
                        kuyruk.push(k);
                    }
                }
            }
        }
        return sira;
    }

    function siradakiIndex() {
        const w = Math.ceil(Math.sqrt(pixelKuyrugu.length));
        const h = Math.ceil(pixelKuyrugu.length / w);

        if (mod === 'sequential') {
            return sira;
        } else if (mod === 'random') {
            if (rastgeleSira.length === 0 || rastgeleSira.length !== pixelKuyrugu.length) {
                rastgeleSira = karistir([...Array(pixelKuyrugu.length).keys()]);
            }
            return rastgeleSira[sira % rastgeleSira.length];
        } else if (mod === 'reverse') {
            return pixelKuyrugu.length - 1 - sira;
        } else if (mod === 'mixed') {
            if (sira % 2 === 0) {
                return sira / 2;
            } else {
                return pixelKuyrugu.length - 1 - Math.floor(sira / 2);
            }
        } else if (mod === 'zone') {
            if (bolgeSira.length === 0 || bolgeSira.length !== pixelKuyrugu.length) {
                bolgeSira = bolgeSirasiOlustur(pixelKuyrugu.length);
            }
            return bolgeSira[sira % bolgeSira.length];
        } else if (mod === 'diagonal') {
            if (caprazSira.length === 0 || caprazSira.length !== pixelKuyrugu.length) {
                caprazSira = caprazSirasiOlustur(w, h);
                caprazSira = caprazSira.filter(i => i < pixelKuyrugu.length);
            }
            return caprazSira[sira % caprazSira.length];
        } else if (mod === 'snake') {
            if (yilanSira.length === 0 || yilanSira.length !== pixelKuyrugu.length) {
                yilanSira = yilanSirasiOlustur(w, h);
                yilanSira = yilanSira.filter(i => i < pixelKuyrugu.length);
            }
            return yilanSira[sira % yilanSira.length];
        } else if (mod === 'ring') {
            if (halkaSira.length === 0 || halkaSira.length !== pixelKuyrugu.length) {
                halkaSira = halkaSirasiOlustur(w, h);
                halkaSira = halkaSira.filter(i => i < pixelKuyrugu.length);
            }
            return halkaSira[sira % halkaSira.length];
        } else if (mod === 'flood') {
            if (yayilmaSira.length === 0 || yayilmaSira.length !== pixelKuyrugu.length) {
                const ortaX = Math.floor(w / 2);
                const ortaY = Math.floor(h / 2);
                yayilmaSira = yayilmaSirasiOlustur(w, h, ortaX, ortaY);
                yayilmaSira = yayilmaSira.filter(i => i < pixelKuyrugu.length);
            }
            return yayilmaSira[sira % yayilmaSira.length];
        }
        return sira;
    }

    function rastgeleGecikme(tabanMs) {
        if (!antiBotAcik) return tabanMs;
        const degisim = Math.floor(Math.random() * 201) - 100;
        let sonuc = tabanMs + degisim;
        if (sonuc < 50) sonuc = 50;
        if (sonuc > 30000) sonuc = 30000;
        return sonuc;
    }

    let YERLESTIR_OP = 0xC2;
    if (ppfMi || pixelyaMi) {
        YERLESTIR_OP = 0x91;
    } else if (gplaceMi) {
        YERLESTIR_OP = 0xC1;
    } else if (pixeldaysMi) {
        YERLESTIR_OP = 0x32;
    } else if (pixareaMi) {
        YERLESTIR_OP = 0xC1;
    }

    const KAYIT_CANVAS_OP = 0xA0;
    const KAYIT_BOLGE_OP = 0xA1;
    const C_ID = 0;

    function dunyaBolgeVeYerel(x, y) {
        let nx = x + 32768,
            ny = y + 32768;
        return {
            bolgeX: Math.floor(nx / 256),
            bolgeY: Math.floor(ny / 256),
            yerelX: nx % 256,
            yerelY: ny % 256
        };
    }

    function paketOlustur(x, y, renkId) {
        const {
            bolgeX,
            bolgeY,
            yerelX,
            yerelY
        } = dunyaBolgeVeYerel(x, y);
        return new Uint8Array([YERLESTIR_OP, bolgeX & 0xFF, bolgeY & 0xFF, C_ID & 0xFF, yerelY & 0xFF, yerelX & 0xFF, renkId & 0xFF]);
    }

    function canvasKayit() {
        if (baglanti && baglanti.readyState === WebSocket.OPEN) {
            baglanti.send(new Uint8Array([KAYIT_CANVAS_OP, C_ID]).buffer);
        }
    }

    function bolgeKayit(x, y) {
        if (baglanti && baglanti.readyState === WebSocket.OPEN) {
            const {
                bolgeX,
                bolgeY
            } = dunyaBolgeVeYerel(x, y);
            let bolgeId = (bolgeX & 0xFF) | ((bolgeY & 0xFF) << 8);
            baglanti.send(new Uint8Array([KAYIT_BOLGE_OP, bolgeId & 0xFF, (bolgeId >> 8) & 0xFF]).buffer);
        }
    }

    function baglan() {
        if (baglanti && baglanti.readyState === WebSocket.OPEN) return;
        baglanti = new WebSocket(`wss://${site}/ws`);
        baglanti.binaryType = 'arraybuffer';
        baglanti.onopen = () => {
            console.log('[WS] Baglandi');
            canvasKayit();
        };
        baglanti.onclose = () => {
            console.log('[WS] Yeniden baglaniyor...');
            setTimeout(baglan, 2000);
        };
        baglanti.onerror = (err) => console.error('[WS] Hata:', err);
    }

    function pixelGonder(x, y, renkId) {
        if (!baglanti || baglanti.readyState !== WebSocket.OPEN) return false;
        baglanti.send(paketOlustur(x, y, renkId).buffer);
        return true;
    }

    function logEkle(msg) {
        const logKutu = document.getElementById('logContainer');
        if (logKutu) {
            const satir = document.createElement('div');
            satir.style.cssText = 'font-size:9px; color:#0f0; margin-bottom:3px; border-bottom:1px solid #222; padding:2px 0;';
            satir.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logKutu.appendChild(satir);
            logKutu.scrollTop = logKutu.scrollHeight;
            while (logKutu.children.length > 100) {
                logKutu.removeChild(logKutu.firstChild);
            }
        }
        console.log(`[LOG] ${msg}`);
    }

    async function siradakiPixel() {
        if (!calisiyor) return;
        if (sira >= pixelKuyrugu.length) {
            calisiyor = false;
            rastgeleTiklamaDurdur();
            durumGuncelle('COMPLETED!');
            logEkle('Tum pixel' + 'ler yerlestirildi!');
            if (calistirBtn) {
                calistirBtn.innerText = 'START';
                calistirBtn.style.background = "#e74c3c";
            }
            return;
        }

        const idx = siradakiIndex();
        const pixel = pixelKuyrugu[idx];

        if (pixmapMi) {
            tikla(pixel.x, pixel.y);
        } else {
            pixelGonder(pixel.x, pixel.y, pixel.renk);
        }

        istatistik.atilan++;
        istatistikGuncelle();

        const yuzde = ((sira / pixelKuyrugu.length) * 100).toFixed(1);
        logEkle(`${mod} | (${pixel.x},${pixel.y}) | ${sira+1}/${pixelKuyrugu.length} (${yuzde}%)`);

        sira++;

        let bekleme = rastgeleGecikme(gecikmeMs);

        tikSayisi++;
        if (bekliyor) return;

        if (tikSayisi >= partiBoyutu) {
            tikSayisi = 0;
            bekliyor = true;
            durumGuncelle(`Waiting ${beklemeSuresiMs/1000}s...`);
            logEkle(`Waiting ${beklemeSuresiMs/1000} seconds`);
            await new Promise(coz => {
                beklemeZamanlayici = setTimeout(() => {
                    bekliyor = false;
                    coz();
                }, beklemeSuresiMs);
            });
            durumGuncelle('Resuming...');
            logEkle('Resuming');
        }

        if (zamanlayici) clearTimeout(zamanlayici);
        zamanlayici = setTimeout(() => siradakiPixel(), bekleme);
    }

    function durumGuncelle(msg) {
        const durumYazi = document.getElementById('durumMsg');
        if (durumYazi) durumYazi.innerHTML = msg;
        const nokta = document.getElementById('durumDot');
        if (nokta) nokta.style.color = calisiyor ? '#0f0' : '#e74c3c';
    }

    function istatistikGuncelle() {
        if (!istatistik.baslamaZamani) return;
        const fark = Math.floor((new Date() - istatistik.baslamaZamani) / 1000);
        const dakika = fark / 60;
        const hiz = dakika > 0 ? Math.round(istatistik.atilan / dakika) : 0;
        const atilanYazi = document.getElementById('statPlaced');
        const sureYazi = document.getElementById('statTime');
        const hizYazi = document.getElementById('statSpeed');
        if (atilanYazi) atilanYazi.innerText = istatistik.atilan;
        if (sureYazi) sureYazi.innerText = fark + "s";
        if (hizYazi) hizYazi.innerText = hiz + " p/m";
    }

    function baslat() {
        if (pixelKuyrugu.length === 0) {
            durumGuncelle('Load an image first!');
            logEkle('ERROR: No image loaded');
            return;
        }
        if (calisiyor) {
            durumGuncelle('Already running!');
            return;
        }

        const gecikmeGirdi = document.getElementById('delayInput');
        if (gecikmeGirdi) {
            let deger = parseInt(gecikmeGirdi.value, 10);
            if (deger >= 100 && deger <= 15000) {
                gecikmeMs = deger;
            } else if (deger < 100) {
                gecikmeMs = 100;
            } else {
                gecikmeMs = 15000;
            }
        }

        const antiBotKutu = document.getElementById('antiBotCheck');
        if (antiBotKutu) antiBotAcik = antiBotKutu.checked;

        const modSec = document.getElementById('placeMode');
        if (modSec) mod = modSec.value;

        rastgeleSira = [];
        bolgeSira = [];
        caprazSira = [];
        yilanSira = [];
        halkaSira = [];
        yayilmaSira = [];

        calisiyor = true;
        tikSayisi = 0;
        bekliyor = false;
        sira = 0;
        istatistik = {
            atilan: 0,
            baslamaZamani: new Date()
        };
        istatistikGuncelle();

        if (!pixmapMi && !pixareaMi) baglan();

        rastgeleTiklamaBaslat();

        durumGuncelle(`STARTED! Mode: ${mod.toUpperCase()} | Delay: ${gecikmeMs}ms`);
        logEkle(`STARTED - Mode: ${mod} | Batch: ${partiBoyutu} | Delay: ${gecikmeMs}ms | AntiBot: ${antiBotAcik ? 'ON' : 'OFF'}`);

        if (calistirBtn) {
            calistirBtn.innerText = 'STOP';
            calistirBtn.style.background = "#57606f";
        }

        siradakiPixel();
    }

    function durdur() {
        calisiyor = false;
        rastgeleTiklamaDurdur();
        if (zamanlayici) clearTimeout(zamanlayici);
        if (beklemeZamanlayici) clearTimeout(beklemeZamanlayici);
        durumGuncelle('STOPPED');
        logEkle('STOPPED by user');
        if (calistirBtn) {
            calistirBtn.innerText = 'START';
            calistirBtn.style.background = "#e74c3c";
        }
    }

    // CAPTCHA SOLVER - sadece belirli sitelerde çalışsın
    const captchaSitesi = !gplaceMi && !pixeldaysMi && !pixareaMi;

    if (captchaSitesi) {
        var yapayZekaLinki = 'https://fuururuny-pixmap-captcha.hf.space/gradio_api/call/predict';
        if (site.includes('pixuniverse.') || site.includes('pixelworldgame.') || site.includes('pixuniverse.fun'))
            yapayZekaLinki = 'https://fuururuny-pixuniverse-captcha.hf.space/gradio_api/call/predict';
        if (site.includes('pixmap.'))
            yapayZekaLinki = 'https://nischay103-captcha-recognition.hf.space/call/predict';
        if (site.includes('canvasland.'))
            yapayZekaLinki = 'https://fuururuny-canvasland-captcha.hf.space/gradio_api/call/predict';
        if (site.includes('pixelplanet.') || site.includes('fuckyouarkeros.'))
            yapayZekaLinki = 'no';

        const pixworldMi = site.includes('pixworld.net');

        function bekle(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        function urlToSvg(url) {
            return fetch(url)
                .then(r => {
                    if (r.status !== 200) {
                        console.log('Status Code: ' + r.status);
                        return;
                    }
                    return r.text();
                })
                .catch(err => console.log('Fetch Error:', err));
        }

        function captchaCoz() {
            const captchaElement = document.querySelector(`img[alt="CAPTCHA"]`);
            if (!captchaElement) return;
            const url = captchaElement.src;
            urlToSvg(url).then(function(svgData) {
                svgData = site.includes('canvasland.') ?
                    svgData.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/<rect[\s\S]*?\/>/g, '<rect width="100%" height="100%" fill="#FFFFFF"/>').replace(/<path fill="none" stroke="(red|green|blue)".*?\/>/g, '').replace(/<circle.*?\/>/g, '').replace(/<rect width="100%" height="100%".*?\/>/g, '') :
                    svgData;
                svgData = svgData
                    .replace(/stroke="#{0,1}\S+"/, 'stroke="black"')
                    .replace(/stroke-width: \d+(\.\d+)*;/, 'stroke-width: 4;')
                    .replace(/fill="#{0,1}\S+"/, 'fill="#FFFFFF"')
                    .replace(/fill="rgba\(240, 240, 240, 0.9\)"/, 'fill="#FFFFFF"')
                    .replace(/fill="rgba\(0, 0, 0, 0.7\)"/, 'fill="rgba(0, 0, 0, 0)"');
                if (site.includes('canvasland.'))
                    svgData = svgData.replace('<path fill="#FFFFFF"', '<rect width="100%" height="100%" fill="#FFFFFF"/>\n<path fill="#FFFFFF"');

                fetch(yapayZekaLinki, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            data: [svgData]
                        })
                    })
                    .then(r => {
                        if (r.status !== 200) return;
                        return r.json();
                    })
                    .then(data => {
                        fetch(`${yapayZekaLinki}/${data.event_id}`)
                            .then(r => r.text())
                            .then(data => {
                                const cevap = data.match(/"([^"]+)"/)[1];
                                const captchaAlani = document.querySelector(`input[name='captcha']`);
                                if (captchaAlani) captchaAlani.value = cevap;
                                console.log('[CAPTCHA] Solved:', cevap);
                                if (document.querySelector(`.Alert`) || document.querySelector(`.CaptchaAlert`)) {
                                    const gonderButonu = document.querySelector(`button[type="submit"]`);
                                    if (gonderButonu) gonderButonu.click();
                                }
                            })
                            .catch(err => console.log('Fetch Error:', err));
                    })
                    .catch(err => console.log('Fetch Error:', err));
            });
        }

        function ppfCaptchaCoz() {
            const svgKutu = document.querySelector("#app > div.Alert.show > form > div > div");
            if (!svgKutu) return;
            const svgIcerik = svgKutu.innerHTML;
            fetch(yapayZekaLinki, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: [svgIcerik]
                    })
                })
                .then(r => {
                    if (r.status !== 200) return;
                    return r.json();
                })
                .then(data => {
                    fetch(`${yapayZekaLinki}/${data.event_id}`)
                        .then(r => r.text())
                        .then(data => {
                            const cevap = data.match(/"([^"]+)"/)[1];
                            const captchaAlani = document.querySelector(`input[name='captcha']`);
                            if (captchaAlani) captchaAlani.value = cevap;
                            console.log('[CAPTCHA] Solved:', cevap);
                            if (document.querySelector(`.Alert`) || document.querySelector(`.CaptchaAlert`)) {
                                const gonderButonu = document.querySelector(`button[type="submit"]`);
                                if (gonderButonu) gonderButonu.click();
                            }
                        })
                        .catch(err => console.log('Fetch Error:', err));
                })
                .catch(err => console.log('Fetch Error:', err));
        }

        function yeniPwCaptchaAl() {
            return fetch('https://api.henrixounez.com/pixworld/captcha.png')
                .then(r => r.blob())
                .then(blob => new Promise((tamam, hata) => {
                    const okuyucu = new FileReader();
                    okuyucu.onload = () => tamam(okuyucu.result.split(',')[1]);
                    okuyucu.onerror = error => hata(error);
                    okuyucu.readAsDataURL(blob);
                }));
        }

        async function pwCaptchaCoz() {
            await bekle(100);
            yeniPwCaptchaAl().then(function(base64str) {
                const bosCaptcha = 'iVBORw0KGgoAAAANSUhEUgAAAfQAAAEsCAYAAAA1u0HIAAANHUlEQVR42u3dW27rNhQF0CTIBDT/QWoI6Vda14gtUuIhD6m1gAsUqK1IfG1S1uNz3/efDwBgal+KAAAEOgAg0AEAgQ4ACHQAEOgAgEAHAAQ6ACDQAUCgAwACHQAQ6ACAQAcAgQ4ACHQAQKADAAIdABDoACDQAQCBDgAIdABQoAMAAh0ABDoAINABAIEOAAh0ABDoAIBABwAEOgAIdABAoAMAAh0AEOgAgEAHAIEOAAh0AECgAwACHQAQ6AAg0AEAgQ4ACHQAQKADgEAHAAQ6ACDQAQCBDgACHQAQ6ACAQAcABDoACHQAQKADAAIdABDoACDQAQCBDgAIdABAoAMIdI/vuwIAgP/z8fHx8bFt28e2bQoCgQ4wc5gLdu7gu1dHeq7ve7Pt1G5rxkFo9WNV/owYg+gzfnODFXqrjqZhAYIeglfo+75f7jg6HtB6tWghwMj2N+0K/d3BXg1rnRIwRkCHFfpdr9ABgMS3rVmdA0C5brdCf3eB3LZtzUK6ZMVf8rfO3LbU+1anlpOe0jMlT7uM2WPLcu49uVJOOqO2q8V2S+opYhJesu+Pn3n+O6Xt68r2/XVsvftmy232WjDNUFZfdn9W6CcbW84DI1Z4uMTZ/keVRW25u/v8mW3VHtcM5R95XD3Lq2V5ZOxrR+34+eE1Leolov5Kttmj79xprF420KN+Sz/73VkbSqtOPlO5nfmbUYNBy0E26rh6lleWSdZMfXNEu4icuBurLxjokalUzP7uTp2vh/rX+p77/j9/W11feV0j9j36d3sGNqLbccTvtazr1mW25s9R7Sl6uTLbD6KO6y6/b//uHl/GN+o1TlHH1bK8vq7/3/5bZF+JeL9fZJm0DLrV4/qp2wWzXmEU+bsi9qNn/VVsP7S3in6drlFHe6nZXiM/pfZvxPewQk9cOeHewj9eRn9ZvHrUcZUcu+jnWX2z14NqD/RVv19y+0QdV2/++v9+8fGJPMYlV/7WbRf9Hr3oYyY5v/XqB9XKf0Z/A/1z3/d9/wPz06pEByvDVgAAAABJRU5ErkJggg==';
                if (base64str === bosCaptcha) {
                    console.log("timeout");
                    return;
                }

                fetch('https://fuururuny-pixworld-captcha.hf.space/gradio_api/call/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            data: [base64str]
                        })
                    })
                    .then(r => {
                        if (r.status !== 200) return;
                        return r.json();
                    })
                    .then(data => {
                        fetch(`https://fuururuny-pixworld-captcha.hf.space/gradio_api/call/predict/${data.event_id}`)
                            .then(r => r.text())
                            .then(async data => {
                                const cevap = data.match(/"([^"]+)"/)[1];
                                console.log('[CAPTCHA] Solved:', cevap);
                                fetch(`https://api.henrixounez.com/pixworld/captcha/verify`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        text: cevap
                                    })
                                });
                                const captchaDiv = document.querySelector(`#__next > div:nth-child(1) > div > div > div:nth-child(1) > div:nth-child(2)`);
                                if (captchaDiv) captchaDiv.click();
                            })
                            .catch(err => console.log('Fetch Error:', err));
                    })
                    .catch(err => console.log('Fetch Error:', err));
            });
        }

        const gozlemci = new MutationObserver(function(mutationsList, gozlemci) {
            for (let mutation of mutationsList) {
                if (mutation.target && mutation.target.getAttribute && mutation.target.getAttribute('alt') === 'CAPTCHA' && mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    pixworldMi ? pwCaptchaCoz() : captchaCoz();
                    gozlemci.disconnect();
                    gozlemci.observe(document.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: true
                    });
                    break;
                }
                if (mutation.type === 'attributes' && mutation.target && mutation.target.localName === 'svg' && (site.includes('pixelplanet.') || site.includes('fuckyouarkeros.'))) {
                    console.log('detected');
                    ppfCaptchaCoz();
                    gozlemci.disconnect();
                    gozlemci.observe(document.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: true
                    });
                    break;
                }
            }
        });

        gozlemci.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    let calistirBtn = null;

    const panel = document.createElement('div');
    panel.id = "xemon-panel";
    panel.style.cssText = "position:fixed; top:10px; right:10px; z-index:10001; background:#000000; color:#ffffff; padding:10px; border:2px solid #e74c3c; width:300px; font-family:monospace; box-shadow:0 5px 20px rgba(0,0,0,0.8);";

    let siteAdi = 'PixelBot';
    if (ppfMi) siteAdi = 'PIXELPLANET';
    else if (pxuMi) siteAdi = 'PXUNIVERSE';
    else if (pixmapMi) siteAdi = 'PIXMAP';
    else if (pixelyaMi) siteAdi = 'PIXELYA';
    else if (pixeldaysMi) siteAdi = 'PIXELDAYS';
    else if (gplaceMi) siteAdi = 'GPLACE';
    else if (pixareaMi) siteAdi = 'PIXAREA';

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #e74c3c; padding-bottom:5px;">
            <span style="font-weight:bold; font-size:12px; color:#e74c3c;">XEMON BOT v0.4</span>
            <span id="closeBtn" style="cursor:pointer; color:#e74c3c; font-size:16px;">✕</span>
        </div>
        
        <div style="display:flex; gap:2px; margin-bottom:10px; flex-wrap:wrap;">
            <button id="tabMainBtn" style="flex:1; background:#e74c3c; color:white; border:none; padding:5px; cursor:pointer; font-size:9px;">MAIN</button>
            <button id="tabPixelBtn" style="flex:1; background:#333; color:white; border:none; padding:5px; cursor:pointer; font-size:9px;">BOT</button>
            <button id="tabConfigBtn" style="flex:1; background:#333; color:white; border:none; padding:5px; cursor:pointer; font-size:9px;">CONFIG</button>
            <button id="tabLogsBtn" style="flex:1; background:#333; color:white; border:none; padding:5px; cursor:pointer; font-size:9px;">LOGS</button>
            <button id="tabSettingsBtn" style="flex:1; background:#333; color:white; border:none; padding:5px; cursor:pointer; font-size:9px;">INFO</button>
        </div>
        
        <div id="mainTab">
            <div style="background:#111; padding:8px; margin-bottom:8px;">
                <div style="font-size:11px; color:#e74c3c;">WELCOME</div>
                <div style="font-size:9px; color:#aaa; margin-top:5px;">Xemon Pixel Bot v0.4 by Reign & Kutsal Balik</div>
            </div>
            <div style="background:#111; padding:8px;">
                <div style="font-size:11px; color:#e74c3c;">HOW TO USE</div>
                <div style="font-size:9px; color:#aaa; margin-top:5px;">
                    1. Go to BOT tab<br>
                    2. Select image file<br>
                    3. Set start coordinates (X,Y)<br>
                    4. Choose place mode<br>
                    5. Click START
                </div>
            </div>
        </div>
        
        <div id="pixelTab" style="display:none;">
            <div style="background:#111; padding:8px; margin-bottom:8px;">
                <div style="margin-top:5px;">
                    <label style="font-size:9px; color:#888;">COORDS</label><br>
                    X: <input id="startX" type="number" value="0" style="width:60px; background:#222; color:#fff; border:1px solid #444; padding:3px; font-size:9px;">
                    Y: <input id="startY" type="number" value="0" style="width:60px; background:#222; color:#fff; border:1px solid #444; padding:3px; font-size:9px;">
                </div>
                <div style="margin-top:5px;">
                    <label style="font-size:9px; color:#888;">IMAGE</label><br>
                    <input type="file" id="imageInput" accept="image/*" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:3px; font-size:9px;">
                </div>
                <div id="imageInfo" style="font-size:8px; color:#e74c3c; margin-top:3px;"></div>
            </div>
            
            <div style="background:#111; padding:8px; margin-bottom:8px;">
                <div style="font-size:10px; color:#e74c3c;">PLACE MODE</div>
                <select id="placeMode" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:4px; font-size:9px;">
                    <option value="sequential">SEQUENTIAL</option>
                    <option value="random">RANDOM</option>
                    <option value="reverse">REVERSE</option>
                    <option value="mixed">MIXED</option>
                    <option value="zone">ZONE</option>
                    <option value="diagonal">DIAGONAL</option>
                    <option value="snake">SNAKE</option>
                    <option value="ring">RING</option>
                    <option value="flood">FLOOD</option>
                </select>
            </div>
            
            <button id="runBtn" style="width:100%; background:#e74c3c; color:white; border:none; padding:8px; font-weight:bold; cursor:pointer; margin-bottom:8px; font-size:10px;">START</button>
            
            <div style="background:#111; padding:8px;">
                <div style="font-size:9px; color:#e74c3c;">STATS</div>
                <div style="display:flex; justify-content:space-between; font-size:9px; margin-top:3px;">
                    <span>Placed:</span><span id="statPlaced" style="color:#0f0;">0</span>
                    <span>Uptime:</span><span id="statTime" style="color:#0f0;">0s</span>
                    <span>Speed:</span><span id="statSpeed" style="color:#0f0;">0</span>
                </div>
            </div>
        </div>
        
        <div id="configTab" style="display:none;">
            <div style="background:#111; padding:8px;">
                <div style="font-size:10px; color:#e74c3c;">DELAY</div>
                <div style="margin-top:5px;">
                    <label style="font-size:9px; color:#888;">Between clicks (ms):</label><br>
                    <input id="delayInput" type="number" value="1000" min="100" max="15000" step="100" style="width:100px; background:#222; color:#fff; border:1px solid #444; padding:4px; font-size:9px;">
                    <span style="font-size:8px; color:#888;"> (100-15000)</span>
                </div>
                <div style="margin-top:8px;">
                    <label style="font-size:9px; color:#888;">
                        <input type="checkbox" id="antiBotCheck"> ANTI BOT (Random delay ±100ms)
                    </label>
                </div>
            </div>
        </div>
        
        <div id="logsTab" style="display:none;">
            <div style="background:#111; padding:8px; height:200px; overflow-y:auto;">
                <div style="font-size:9px; color:#e74c3c; margin-bottom:5px;">LIVE LOGS</div>
                <div id="logContainer" style="font-size:8px; color:#0f0;"></div>
            </div>
        </div>
        
        <div id="settingsTab" style="display:none;">
            <div style="background:#111; padding:8px;">
                <div style="font-size:10px; color:#e74c3c;">CREDITS</div>
                <div style="font-size:9px; color:#aaa; margin-top:5px;">REIGN & KUTSAL BALIK</div>
                <div style="font-size:8px; color:#555; margin-top:5px;">Site: ${siteAdi}</div>
                <div style="display:flex; gap:5px; margin-top:8px;">
                    <button id="copyBtn" style="flex:1; background:#333; color:white; border:none; padding:4px; font-size:8px; cursor:pointer;">COPY CFG</button>
                    <button id="discBtn" style="flex:1; background:#5865F2; color:white; border:none; padding:4px; font-size:8px; cursor:pointer;">DISCORD</button>
                </div>
            </div>
        </div>
        
        <div id="aktifBar" style="background:#111; border:1px solid #e74c3c; padding:5px; margin-top:8px; text-align:center;">
            <span id="durumDot" style="color:#e74c3c;">●</span> <span id="durumMsg" style="font-size:9px;">STANDBY</span>
        </div>
    `;
    document.body.appendChild(panel);

    const mainButon = document.getElementById('tabMainBtn');
    const botButon = document.getElementById('tabPixelBtn');
    const configButon = document.getElementById('tabConfigBtn');
    const logsButon = document.getElementById('tabLogsBtn');
    const infoButon = document.getElementById('tabSettingsBtn');
    const mainSekme = document.getElementById('mainTab');
    const botSekme = document.getElementById('pixelTab');
    const configSekme = document.getElementById('configTab');
    const logsSekme = document.getElementById('logsTab');
    const infoSekme = document.getElementById('settingsTab');

    function sekmeGec(sekme) {
        mainSekme.style.display = 'none';
        botSekme.style.display = 'none';
        configSekme.style.display = 'none';
        logsSekme.style.display = 'none';
        infoSekme.style.display = 'none';
        mainButon.style.background = '#333';
        botButon.style.background = '#333';
        configButon.style.background = '#333';
        logsButon.style.background = '#333';
        infoButon.style.background = '#333';

        if (sekme === 'main') {
            mainSekme.style.display = 'block';
            mainButon.style.background = '#e74c3c';
        } else if (sekme === 'pixel') {
            botSekme.style.display = 'block';
            botButon.style.background = '#e74c3c';
        } else if (sekme === 'config') {
            configSekme.style.display = 'block';
            configButon.style.background = '#e74c3c';
        } else if (sekme === 'logs') {
            logsSekme.style.display = 'block';
            logsButon.style.background = '#e74c3c';
        } else if (sekme === 'settings') {
            infoSekme.style.display = 'block';
            infoButon.style.background = '#e74c3c';
        }
    }

    mainButon.onclick = () => sekmeGec('main');
    botButon.onclick = () => sekmeGec('pixel');
    configButon.onclick = () => sekmeGec('config');
    logsButon.onclick = () => sekmeGec('logs');
    infoButon.onclick = () => sekmeGec('settings');

    const xGirdi = document.getElementById('startX');
    const yGirdi = document.getElementById('startY');
    const resimGirdi = document.getElementById('imageInput');
    const resimBilgi = document.getElementById('imageInfo');
    const kapatButon = document.getElementById('closeBtn');
    const kopyalaButon = document.getElementById('copyBtn');
    const discordButon = document.getElementById('discBtn');
    calistirBtn = document.getElementById('runBtn');

    async function otomatikYenile() {
        if (!yuklenenResim) return;
        baslangicX = parseInt(xGirdi.value, 10) || 0;
        baslangicY = parseInt(yGirdi.value, 10) || 0;
        durumGuncelle('Loading...');
        try {
            pixelKuyrugu = await resimYukle(yuklenenResim, baslangicX, baslangicY);
            sira = 0;
            istatistik.atilan = 0;
            durumGuncelle(`${pixelKuyrugu.length} pixels ready`);
            if (resimBilgi) resimBilgi.innerHTML = `${pixelKuyrugu.length}px | (${baslangicX},${baslangicY})`;
            logEkle(`Loaded ${pixelKuyrugu.length} pixels at (${baslangicX},${baslangicY})`);
        } catch (err) {
            durumGuncelle('Error!');
            logEkle('ERROR loading image');
        }
    }

    xGirdi.onchange = () => {
        if (yuklenenResim) otomatikYenile();
    };
    yGirdi.onchange = () => {
        if (yuklenenResim) otomatikYenile();
    };

    resimGirdi.addEventListener('change', async (e) => {
        const dosya = e.target.files[0];
        if (!dosya) return;
        yuklenenResim = dosya;
        baslangicX = parseInt(xGirdi.value, 10) || 0;
        baslangicY = parseInt(yGirdi.value, 10) || 0;
        durumGuncelle('Loading...');
        try {
            pixelKuyrugu = await resimYukle(dosya, baslangicX, baslangicY);
            sira = 0;
            istatistik.atilan = 0;
            durumGuncelle(`${pixelKuyrugu.length} pixels ready`);
            const resim = new Image();
            const okuyucu = new FileReader();
            okuyucu.onload = function(e2) {
                resim.src = e2.target.result;
                resim.onload = function() {
                    if (resimBilgi) resimBilgi.innerHTML = `${resim.width}x${resim.height} | ${pixelKuyrugu.length}px | (${baslangicX},${baslangicY})`;
                };
            };
            okuyucu.readAsDataURL(dosya);
            logEkle(`Loaded ${pixelKuyrugu.length} pixels from ${dosya.name}`);
        } catch (err) {
            durumGuncelle('Error!');
            logEkle('ERROR loading image');
        }
    });

    if (calistirBtn) {
        calistirBtn.onclick = () => {
            if (calisiyor) durdur();
            else baslat();
        };
    }

    kapatButon.onclick = () => panel.remove();

    kopyalaButon.onclick = () => {
        navigator.clipboard.writeText(`XEMON v0.4 | ${siteAdi} | Mode: ${mod} | Delay: ${gecikmeMs}ms | AntiBot: ${antiBotAcik ? 'ON' : 'OFF'} | Pixels: ${pixelKuyrugu.length}`);
        durumGuncelle('Copied!');
        logEkle('Config copied to clipboard');
    };

    discordButon.onclick = () => window.open('https://discord.gg/RhVaESfYFX', '_blank');

    let surukleniyor = false,
        anlikX, anlikY, baslangicXKonum, baslangicYKonum, xKayma = 0,
        yKayma = 0;
    const surukleBasla = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
        baslangicXKonum = (e.type === "touchstart" ? e.touches[0].clientX : e.clientX) - xKayma;
        baslangicYKonum = (e.type === "touchstart" ? e.touches[0].clientY : e.clientY) - yKayma;
        surukleniyor = true;
    };
    const surukleBitir = () => {
        surukleniyor = false;
    };
    const surukle = (e) => {
        if (!surukleniyor) return;
        e.preventDefault();
        anlikX = (e.type === "touchmove" ? e.touches[0].clientX : e.clientX) - baslangicXKonum;
        anlikY = (e.type === "touchmove" ? e.touches[0].clientY : e.clientY) - baslangicYKonum;
        xKayma = anlikX;
        yKayma = anlikY;
        panel.style.transform = `translate3d(${anlikX}px, ${anlikY}px, 0)`;
    };
    panel.addEventListener("touchstart", surukleBasla);
    panel.addEventListener("touchend", surukleBitir);
    panel.addEventListener("touchmove", surukle);
    panel.addEventListener("mousedown", surukleBasla);
    panel.addEventListener("mouseup", surukleBitir);
    panel.addEventListener("mousemove", surukle);

    logEkle(`Bot started on ${siteAdi}`);
    sekmeGec('main');

})();
