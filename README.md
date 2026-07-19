# نشر لعبة Codenames العربية — من المتصفح فقط (بدون تنزيل أي برنامج)

هذه الطريقة لا تتطلب تنزيل Node.js أو Git على جهازك. كل شيء يُعمل من المتصفح،
والخادم يعمل على سيرفرات Render (هم ينزلون Node.js، أنت لا).

## الخطوات

### 1) إنشاء مستودع على GitHub (من المتصفح)
1. ادخل https://github.com واسجّل دخولك (أو أنشئ حساباً).
2. اضغط **New** (أو + ← New repository).
3. اسم المستودع: `codenames-ar`
4. اختر **Public**.
5. لا تضِف README ولا .gitignore (سنرفعها يدوياً).
6. اضغط **Create repository**.

### 2) رفع الملفات يدوياً (من المتصفح — بدون Git)
1. في صفحة المستودع اضغط **Add file → Upload files**.
2. اسحب وأفلت هذه الملفات والمجلدات:
   - `package.json`
   - `server.js`
   - `game.js`
   - `words.js`
   - `Procfile`
   - `render.yaml`
   - `.gitignore`
   - مجلد `public` كاملاً (index.html, style.css, client.js)
3. اكتب رسالة commit: `Codenames Arabic game` ثم اضغط **Commit changes**.

### 3) النشر على Render (من المتصفح)
1. ادخل https://render.com واضغط **Sign Up** واربط حساب GitHub.
2. اضغط **New → Web Service**.
3. اختر المستودع `codenames-ar`.
4. الإعدادات (مملوءة تلقائياً عبر render.yaml، لكن تأكد):
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. اضغط **Create Web Service**.
6. انتظر بضع دقائق حتى يكتمل البناء. ستظهر رسالة `Your service is live` ورابط مثل:
   `https://codenames-ar.onrender.com`

### 4) شارك الرابط
أعطِ الرابط لأصدقائك — أي شخص في العالم يفتحه ويدخل رمز الغرفة يلعب معك مباشرة.

## ملاحظات
- الخادم يستخدم متغيّر `PORT` ويعمل على `0.0.0.0` تلقائياً (ما تطلبه الاستضافات).
- الخطة المجانية قد "تنام" بعد فترة من عدم الاستخدام، فتأخذ بضع ثوانٍ عند أول فتح.
- المضيف (منشئ الغرفة) يوزّع الأدوار ويبدأ اللعبة.
- الكلمات: 100 كلمة عربية مدمجة + يمكن إضافة كلمات مخصصة قبل البدء.
