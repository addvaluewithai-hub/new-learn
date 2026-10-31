# المطلوب من صاحب المشروع (Owner)

آخر تحديث: 2026-10-31. الحاجات اللي محدش يقدر يعملها غيرك: حسابات ولوحات تحكم، قرارات،
فلوس، قانوني، وناس حقيقيين. كل الباقي Claude شغال عليه. لما تخلّص بند، علّم عليه `[x]` أو
قول لـClaude وهو يحدّثه. **متكتبش هنا أي مفتاح أو توكن أو باسورد أو IP: الريبو عام.**

## 1. عاجل: قبل تقديم YC (2 نوفمبر)

- [ ] **V4** فيديو المؤسس ونص التقديم.
- [ ] **V5** حساب تجريبي للمراجعين (YC ودليل Claude) فيه كورس الديمو. اعمله من صفحة التسجيل
      العادية، وبعد ما تضيف STAFF_EMAILS (تحت) اديله رصيد من صفحة `?credits`.
- [ ] **A4** جرّب الموصّل من Claude: ضيف `https://new-learn.pages.dev/mcp` كـconnector، اعمل
      كورس فيه بورد، اكتب ملحوظة على درس، وخلّي Claude يصلحها.
- [ ] **A5** تأكد إن الكورس ظهر في «مسوداتي» وإن المعاينة شغالة بالبورد والملاحظات.
- [ ] **V8** البيتش ديك وصفحة ملخص (Claude يقدر يجهّز مسودة لو طلبت).

## 2. إعدادات في لوحات التحكم (دقايق)

- [ ] **STAFF_EMAILS** في Cloudflare: مشروع `new-learn` ← Settings ← Variables ← ضيف
      `STAFF_EMAILS` = إيميلات المراجعين مفصولة بفاصلة (Production و Preview)، وبعدين
      Redeploy. من غيره صفحات `?review` و `?ops` مش هتظهر. (docs/credits.md)
- [ ] **O5** تنبيهات التكلفة: Google Cloud (Gemini)، Neon، Cloudflare. الخطوات في
      docs/operations.md.
- [ ] **الـworker على Cloud Run (بدل السيرفر):** من Cloud Shell في مشروع الرصيد: اعمل
      secret اسمه `BUILDER_TOKEN` (نفس قيمة Cloudflare) وsecret اسمه `CLAUDE_CODE_OAUTH_TOKEN`
      (من `claude setup-token` على جهازك)، وبعدين `bash workers/cloudrun/deploy.sh`. الخطوات
      كلها في docs/worker-cloud-run.md. بعد أول كورس يتبني من Cloud Run، وقّف خدمة السيرفر.
- [ ] **O2** مراقبة إن الموقع شغال (uptime) للتطبيق وموقع البوردات و`/mcp` (أي خدمة مجانية).
- [ ] **O3** جرّب استرجاع نسخة احتياطية من Neon على branch جديد (متلمسش branch الإنتاج).
- [ ] **O4** بيئة staging ثابتة: preview branch ليها Neon branch خاص بيها.
- [ ] **A2** دور قراءة فقط `learn_board_reader` لموقع البوردات في Neon (docs/connector.md).
- [ ] **W9** إحصائيات زيارات الموقع من غير كوكيز (Cloudflare Web Analytics).

## 2ب. الصوت المسجّل على Vertex AI (رصيد الـ300$) وتوكن Cloudflare

- [ ] **Google Cloud (Cloud Shell، 5 دقايق):** نفس الـservice account والـWIF pool بتوع
      `vertex_ai`، بس خلّي الـprovider يثق في ريبو `new-learn` كمان. من غير أي مفتاح؛ الأوامر
      تحت القائمة دي. (لو الأسماء عندك مختلفة، استخدم اللي في `vertex_ai/docs/SETUP.md`.)
- [ ] **GitHub → new-learn → Settings → Secrets and variables → Actions → Variables:**
      `GCP_PROJECT_ID` و`GCP_SERVICE_ACCOUNT` و`GCP_WIF_PROVIDER` (نفس قيم `vertex_ai`).
- [ ] **وفي نفس الصفحة ← Secrets:** `BUILDER_TOKEN` بنفس القيمة اللي على Cloudflare، عشان
      الـworkflow يرجّع الصوت للمنصة.
- [ ] **توكن Cloudflare عشان Claude يعمل الباقي بنفسه:** اعمل **Account API Token** بصلاحيات
      Workers R2 Storage: Edit، وCloudflare Pages: Edit، وAccount Settings: Read. **متحطّوش في الشات.**
      حطّه في إعدادات بيئة Claude Code دي (قائمة البيئة في عنوان الجلسة ← Edit ← Network secrets)
      باسم `CLOUDFLARE_API_TOKEN`، ومعاه متغيّر `CLOUDFLARE_ACCOUNT_ID`. الجلسة الجديدة بتشوفهم.
      بعدها Claude يعمل الـR2 bucket وربطه بالمشروع و`STAFF_EMAILS` وباقي المتغيّرات.
      (البديل: تعمل bucket اسمه `new-learn-media` وتربطه بمشروع `new-learn` باسم `MEDIA` بإيدك.)

أوامر Cloud Shell لخطوة Google Cloud:

```bash
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gcloud iam workload-identity-pools providers update-oidc vertex-ai \
  --project="$PROJECT_ID" --location=global --workload-identity-pool=github-media \
  --attribute-condition="(assertion.repository == 'addvaluewithai-hub/vertex_ai' || assertion.repository == 'addvaluewithai-hub/new-learn') && assertion.ref == 'refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding "vertex-media-factory@$PROJECT_ID.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-media/attribute.repository/addvaluewithai-hub/new-learn"
```

## 3. قرارات مستنياك

- [ ] **D1 / B1** اسم البراند (وبعده **B4** شراء الدومين، **B5** ربطه بـCloudflare، **B6** إيميل
      الدعم على الدومين).
- [ ] **لغة أول زيارة:** الموقع يفتح بلغة المتصفح ولو مش مدعومة يفتح عربي. نخليه كده؟
- [ ] **D6** مزوّد الدفع (Stripe، Fawry، Paymob…) اللي يشتغل في مصر والخليج وبره ويدفع
      للمدرسين. الهيكل جاهز ومستني التوصيل.
- [ ] **D3** المكافآت: streaks، نقط، شارات، لوحة ترتيب؟ وإيه اللي يظهر للأطفال.
- [ ] **D4** الإجابات المكتوبة: إجابة نموذجية والطالب يقيّم نفسه، ولا تصحيح بالـAI (تكلفة لكل إجابة).
- [ ] **D5** شكل الفصل: نفس شكل Learn القديم ولا البراند الجديد.
- [ ] **D7** الموبايل: تطبيق ويب يتثبّت الأول ولا تطبيق native.
- [ ] **D8** الأطفال: أقل سن، موافقة الأهل، قواعد البيانات حسب البلد.
- [ ] **D10** (بعدين) ترخيص Remotion المدفوع لما الشركة توصل 4 أشخاص.

## 4. قانوني وفلوس

- [ ] **L1** راجع سياسة الخصوصية (المسودة على `/privacy`).
- [ ] **L2** راجع شروط الاستخدام (المسودة على `/terms`).
- [ ] **L3** طريقة شكاوى حقوق النشر والحذف.
- [ ] **L4** قواعد بيانات الأطفال (بعد D8).
- [ ] **L6** الشركة والحساب البنكي للمدفوعات وتحويلات المدرسين.
- [ ] (عند الإطلاق) مفتاح Anthropic API باسم `new-learn-builder` يتحط في ملف بيئة السيرفر بس.

## 5. ناس حقيقيين

- [ ] **V6** أول مدرسين وطلبة يستخدموها كل أسبوع.
- [ ] **V10** مقابلات: 10 مدرسين و10 أولياء أمور، الملاحظات في `docs/research/`.
- [ ] **A7** نفس تجربة الموصّل من ChatGPT (developer mode) ومن Claude Code CLI.
