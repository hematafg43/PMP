// ============================================================
//  ads.js - د PopAds اعلاناتو تنظیمات
// ============================================================

// دلته خپل د PopAds سایټ آئی ډي واچوئ (وروسته له هغه چې ویبپاڼه ثبت شي)
const POPADS_SITE_ID = 'YOUR_SITE_ID_HERE'; // <-- بدل کړئ!

// د PopAds ترتیبات
const POPADS_CONFIG = {
    siteId: POPADS_SITE_ID,
    minBid: 0,
    popundersPerIP: 0,
    delayBetween: 0,
    default: false,
    defaultPerDay: 0,
    topmostLayer: false
};

// ============================================================
//  د PopAds سکریپټ لوډ کول
// ============================================================
function loadPopAdsScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="popads.net"]')) {
            if (typeof window._pop !== 'undefined') {
                window._pop.push(['siteId', POPADS_CONFIG.siteId]);
                window._pop.push(['minBid', POPADS_CONFIG.minBid]);
                window._pop.push(['popundersPerIP', POPADS_CONFIG.popundersPerIP]);
                window._pop.push(['delayBetween', POPADS_CONFIG.delayBetween]);
                window._pop.push(['default', POPADS_CONFIG.default]);
                window._pop.push(['defaultPerDay', POPADS_CONFIG.defaultPerDay]);
                window._pop.push(['topmostLayer', POPADS_CONFIG.topmostLayer]);
            }
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = '//c1.popads.net/pop.js';
        
        script.onload = () => {
            window._pop = window._pop || [];
            window._pop.push(['siteId', POPADS_CONFIG.siteId]);
            window._pop.push(['minBid', POPADS_CONFIG.minBid]);
            window._pop.push(['popundersPerIP', POPADS_CONFIG.popundersPerIP]);
            window._pop.push(['delayBetween', POPADS_CONFIG.delayBetween]);
            window._pop.push(['default', POPADS_CONFIG.default]);
            window._pop.push(['defaultPerDay', POPADS_CONFIG.defaultPerDay]);
            window._pop.push(['topmostLayer', POPADS_CONFIG.topmostLayer]);
            resolve();
        };
        
        script.onerror = () => {
            const script2 = document.createElement('script');
            script2.type = 'text/javascript';
            script2.async = true;
            script2.src = '//c2.popads.net/pop.js';
            
            script2.onload = () => {
                window._pop = window._pop || [];
                window._pop.push(['siteId', POPADS_CONFIG.siteId]);
                window._pop.push(['minBid', POPADS_CONFIG.minBid]);
                window._pop.push(['popundersPerIP', POPADS_CONFIG.popundersPerIP]);
                window._pop.push(['delayBetween', POPADS_CONFIG.delayBetween]);
                window._pop.push(['default', POPADS_CONFIG.default]);
                window._pop.push(['defaultPerDay', POPADS_CONFIG.defaultPerDay]);
                window._pop.push(['topmostLayer', POPADS_CONFIG.topmostLayer]);
                resolve();
            };
            
            script2.onerror = () => {
                console.warn('PopAds: دواړه سکریپټونه پاتې راغلل');
                reject(new Error('PopAds script failed to load'));
            };
            
            document.head.appendChild(script2);
        };
        
        document.head.appendChild(script);
    });
}

// ============================================================
//  د PopAds اعلان ښودل
// ============================================================
function showPopAdsAd() {
    return new Promise((resolve) => {
        if (typeof window._pop !== 'undefined' && window._pop.length > 0) {
            try {
                window._pop.push(['open']);
                setTimeout(resolve, 2000);
            } catch (error) {
                console.warn('PopAds error:', error);
                resolve();
            }
        } else {
            console.warn('PopAds not loaded');
            resolve();
        }
    });
}

// ============================================================
//  د PopAds سره د "کاپي پرامپټ" فنکشن
// ============================================================
async function handleCopyWithPopAds(prompt, btn, statusId = null) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="border-color:#6c5ce7; border-top-color:white;"></span> اعلان لوډیږي...';
    btn.disabled = true;

    try {
        await loadPopAdsScript();
        await showPopAdsAd();
        
        await navigator.clipboard.writeText(prompt);
        
        btn.innerHTML = '✅ کاپي شو!';
        btn.classList.add('copied');
        if (statusId) {
            const statusEl = document.getElementById(statusId);
            if (statusEl) statusEl.textContent = '✅ کاپي شو!';
        }
    } catch (error) {
        console.error('Error:', error);
        try {
            await navigator.clipboard.writeText(prompt);
            btn.innerHTML = '✅ کاپي شو!';
            btn.classList.add('copied');
        } catch (fallbackError) {
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            btn.innerHTML = '✅ کاپي شو!';
            btn.classList.add('copied');
        }
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
            btn.disabled = false;
            if (statusId) {
                const statusEl = document.getElementById(statusId);
                if (statusEl) statusEl.textContent = '';
            }
        }, 3000);
    }
}

// د PopAds سکریپټ مخکې له مخکې لوډ کړئ
document.addEventListener('DOMContentLoaded', () => {
    loadPopAdsScript().catch(console.warn);
});

console.log('PVP Store: د PopAds سره تیار دی!'); 
