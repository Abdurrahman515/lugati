# تعليمات الدمج — لغتي (الفصل الدراسي الأول)

## المحتوى
- `package.json` — الاعتماديات (react, framer-motion, lucide-react) وسكربت `validate`.
- `src/` — كامل الكود والمحتوى.

## الخطوات
1. **package.json:** إن كان لديك واحد، ادمج فقط: `dependencies` (framer-motion, lucide-react, react, react-dom)
   و`devDependencies` (tsx) وسكربت `"validate": "tsx src/dev/validate.ts"`. ثم `npm install`.
2. **src/:** انسخ المجلد إلى مشروعك. الملفات التالية قد تستبدل ملفات لديك بنفس الاسم:
   `src/main.tsx`, `src/App.tsx`, `src/index.css`. احتفظ بنسخة احتياطية قبل الاستبدال.
3. لم أرسل `index.html` ولا `vite.config.ts` ولا ملفات النشر (حسب طلبك). المطلوب فقط:
   `index.html` يحوي `<div id="root">` ويحمّل `/src/main.tsx`، و`vite.config.ts` بإضافة `@vitejs/plugin-react`.
   التوجيه بـ hash فلا يحتاج إعداد خادم خاص.
4. شغّل: `npm run validate` (فحص المحتوى) ثم `npm run dev`.

## ما تغيّر ويحتاج مراجعتك
- **نطاق اختبار المنتصف:** الوحدتان ١ و٢ (ثابت `MID_UNITS` في `src/content/registry.ts`). عدّله إن أردت نطاقاً آخر.
- **القيم:** مراجعة الوحدة ١٦ سؤالاً/٧٠٪، المنتصف ٣٠/٦٠٪، النهاية ٦٠/٦٠٪، قفل ٢٤ ساعة بعد الرسوب.
- **مفتاح التخزين:** `lugha-app:v1` للتقدم، و`lugha-app:ui:v1` لحالة الطي.
