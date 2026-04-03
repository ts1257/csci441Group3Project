function FAQ() {
  return (
    <div className="pb-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">FAQ</h2>

      <div className=" mx-auto space-y-4">
        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="radio" name="faq" defaultChecked />
          <div className="collapse-title font-semibold">
            What is Multi-Persona Planner?
          </div>
          <div className="collapse-content text-sm">
            It is a planner that allows you to manage different parts of your
            life by switching between personas such as Student, Work, and
            Personal.
          </div>
        </div>

        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="radio" name="faq" />
          <div className="collapse-title font-semibold">
            Can I use the app without internet?
          </div>
          <div className="collapse-content text-sm">
            Yes, the app supports offline usage. You can create and manage tasks
            without internet, and your data will sync automatically once you are
            online.
          </div>
        </div>

        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="radio" name="faq" />
          <div className="collapse-title font-semibold">
            How does persona switching help me?
          </div>
          <div className="collapse-content text-sm">
            Persona switching filters your tasks so you only see what is
            relevant to your current role, helping you stay focused and reduce
            distractions.
          </div>
        </div>

        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="radio" name="faq" />
          <div className="collapse-title font-semibold">
            Is my data saved securely?
          </div>
          <div className="collapse-content text-sm">
            Your data is stored securely and synchronized with the cloud to
            ensure it is always available and protected.
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
