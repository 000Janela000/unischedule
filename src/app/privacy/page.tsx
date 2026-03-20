export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">კონფიდენციალურობის პოლიტიკა / Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">ბოლო განახლება: 2026-03-21</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">UniHub EMIS Connector</h2>
          <p>
            UniHub EMIS Connector არის Chrome გაფართოება, რომელიც აკავშირებს UniHub-ს
            (unihub-edu.vercel.app) საქართველოს აგრარული უნივერსიტეტის EMIS სისტემასთან
            (emis.campus.edu.ge).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">რა მონაცემებს ვაგროვებთ</h2>
          <p>გაფართოება კითხულობს მხოლოდ:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>EMIS სისტემის ავტორიზაციის სესიის მონაცემებს (emis.campus.edu.ge-დან)</li>
          </ul>
          <p className="mt-2">გაფართოება <strong>არ</strong> აგროვებს:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>პირად ინფორმაციას (სახელი, მისამართი, ტელეფონი)</li>
            <li>ბრაუზერის ისტორიას</li>
            <li>სხვა ვებსაიტების მონაცემებს</li>
            <li>ფინანსურ ინფორმაციას</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">როგორ ვიყენებთ მონაცემებს</h2>
          <p>
            EMIS სესიის მონაცემები გამოიყენება მხოლოდ UniHub-ზე ნიშნების, GPA-ს და
            აკადემიური ინფორმაციის საჩვენებლად. მონაცემები ინახება ლოკალურად თქვენს
            ბრაუზერში და UniHub-ის სერვერზე დაშიფრული httpOnly cookie-ს სახით (24 საათი).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">მონაცემთა გაზიარება</h2>
          <p>
            ჩვენ <strong>არ ვყიდით</strong> და <strong>არ ვაზიარებთ</strong> თქვენს მონაცემებს
            მესამე მხარეებთან. მონაცემები გამოიყენება მხოლოდ UniHub-ის ფუნქციონალისთვის.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">მონაცემთა წაშლა</h2>
          <p>
            შეგიძლიათ ნებისმიერ დროს წაშალოთ თქვენი მონაცემები:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>გაფართოების წაშლით Chrome-დან</li>
            <li>UniHub-ის პარამეტრებში EMIS კავშირის გათიშვით</li>
            <li>ბრაუზერის მონაცემების გასუფთავებით</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">კონტაქტი</h2>
          <p>
            კითხვების შემთხვევაში: <a href="mailto:sjane2021@agruni.edu.ge" className="text-primary hover:underline">sjane2021@agruni.edu.ge</a>
          </p>
          <p className="mt-1">
            GitHub: <a href="https://github.com/000Janela000/unihub" className="text-primary hover:underline">github.com/000Janela000/unihub</a>
          </p>
        </section>
      </div>
    </main>
  );
}
