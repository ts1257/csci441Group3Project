function About() {
  return (
    <div className="pb-16">
      <div className="bg-base-200 rounded-2xl p-8 sm:p-12 mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          About
        </h2>

        <p className="text-base sm:text-lg leading-8 text-gray-600">
          Multi-Persona Planner is built for people who balance multiple roles
          in their daily lives. Whether you are a student managing assignments,
          a professional handling work tasks, or someone trying to maintain a
          healthy lifestyle, switching between these responsibilities can be
          overwhelming.
        </p>

        <p className="mt-4 text-base sm:text-lg leading-8 text-gray-600">
          Traditional planners treat all tasks the same, creating clutter and
          making it difficult to focus. Our solution introduces the concept of
          “personas,” allowing users to switch between different contexts such
          as Student, Work, and Personal, so only relevant tasks are shown at a
          time.
        </p>

        <p className="mt-4 text-base sm:text-lg leading-8 text-gray-600">
          The system also supports offline functionality, ensuring that users
          can continue managing tasks even without an internet connection. Once
          connectivity is restored, all changes are automatically synced,
          providing a seamless experience.
        </p>

        <p className="mt-4 text-base sm:text-lg leading-8 text-gray-600">
          By combining intelligent filtering, offline support, and productivity
          insights, Multi-Persona Planner aims to reduce stress and help users
          stay organized, focused, and in control of their daily lives.
        </p>
      </div>
    </div>
  );
}

export default About;
