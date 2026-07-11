class DummyData {
  DummyData._();

  // ── User ─────────────────────────────────────────
  static const Map<String, dynamic> user = {
    'id': 'u1',
    'name': 'Alex Johnson',
    'email': 'alex@careerpilot.dev',
    'careerGoal': 'Full Stack Developer',
    'skillLevel': 'Intermediate',
    'xp': 340,
    'level': 4,
    'xpToNextLevel': 500,
    'streak': 7,
    'longestStreak': 14,
    'tasksCompleted': 47,
    'quizzesPassed': 3,
    'roadmapsGenerated': 2,
    'dailyStudyHours': 2.5,
    'preferredTypes': ['Video', 'Article'],
    'xpToday': 60,
    'tasksToday': 2,
    'totalTasksToday': 5,
  };

  // ── Streak Days (Mon–Sun) ─────────────────────────
  static const List<Map<String, dynamic>> streakDays = [
    {'label': 'Mon', 'status': 'completed'},
    {'label': 'Tue', 'status': 'completed'},
    {'label': 'Wed', 'status': 'completed'},
    {'label': 'Thu', 'status': 'completed'},
    {'label': 'Fri', 'status': 'completed'},
    {'label': 'Sat', 'status': 'partial'},
    {'label': 'Sun', 'status': 'today'},
  ];

  // ── Weekly XP (for chart) ─────────────────────────
  static const List<double> weeklyXp = [45, 80, 60, 100, 75, 120, 60];
  static const List<String> weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── Roadmaps ─────────────────────────────────────
  static const List<Map<String, dynamic>> roadmaps = [
    {
      'id': 'r1',
      'targetCareer': 'Full Stack Developer',
      'status': 'active',
      'overallCompletion': 0.42,
      'activePhaseNumber': 2,
      'totalPhases': 4,
      'startDate': 'Jan 15, 2026',
      'estimatedEnd': 'Jul 15, 2026',
      'phases': [
        {
          'number': 1,
          'title': 'HTML & CSS Fundamentals',
          'status': 'completed',
          'quizScore': 90,
          'estimatedWeeks': 3,
          'difficulty': 'Beginner',
          'completion': 1.0,
          'summary':
              'Master the building blocks of the web — semantic HTML structure, modern CSS layout techniques, and responsive design principles that power every website.',
          'subtopics': [
            {
              'name': 'HTML5 Semantics',
              'desc': 'Proper use of semantic elements for accessibility and SEO.'
            },
            {
              'name': 'CSS Flexbox',
              'desc': 'One-dimensional layout model for dynamic spacing.'
            },
            {
              'name': 'CSS Grid',
              'desc': 'Two-dimensional layout system for complex page structures.'
            },
            {
              'name': 'Responsive Design',
              'desc': 'Media queries and fluid layouts for all screen sizes.'
            },
          ],
          'skills': [
            {'name': 'HTML5 Semantics', 'completed': true},
            {'name': 'CSS Flexbox', 'completed': true},
            {'name': 'CSS Grid', 'completed': true},
            {'name': 'Media Queries', 'completed': true},
            {'name': 'CSS Animations', 'completed': true},
          ],
          'objectives': [
            'Build a fully responsive webpage from scratch',
            'Use Flexbox and Grid for complex layouts',
            'Apply accessibility best practices',
          ],
        },
        {
          'number': 2,
          'title': 'JavaScript & TypeScript',
          'status': 'active',
          'quizScore': null,
          'estimatedWeeks': 4,
          'difficulty': 'Intermediate',
          'completion': 0.40,
          'summary':
              'Deep dive into JavaScript fundamentals and modern TypeScript for type-safe, scalable development. Cover async patterns, DOM interaction, and type system essentials.',
          'subtopics': [
            {
              'name': 'ES6+ Features',
              'desc': 'Arrow functions, destructuring, spread, modules.'
            },
            {'name': 'Async/Await', 'desc': 'Promises, async/await, error handling patterns.'},
            {
              'name': 'TypeScript Basics',
              'desc': 'Types, interfaces, generics, utility types.'
            },
            {
              'name': 'DOM Manipulation',
              'desc': 'Querying, modifying, and listening to DOM events.'
            },
          ],
          'skills': [
            {'name': 'ES6+ Features', 'completed': true},
            {'name': 'Async/Await', 'completed': true},
            {'name': 'TypeScript', 'completed': false},
            {'name': 'DOM Manipulation', 'completed': false},
            {'name': 'Error Handling', 'completed': false},
          ],
          'objectives': [
            'Convert a callback-based codebase to async/await',
            'Write type-safe components with TypeScript',
            'Build a dynamic UI with vanilla JS',
          ],
        },
        {
          'number': 3,
          'title': 'Node.js & Express',
          'status': 'locked',
          'quizScore': null,
          'estimatedWeeks': 4,
          'difficulty': 'Intermediate',
          'completion': 0.0,
          'summary':
              'Build powerful server-side applications with Node.js and the Express framework. Learn REST API design, middleware patterns, and authentication flows.',
          'subtopics': [
            {
              'name': 'Node.js Core',
              'desc': 'Event loop, modules, file system, streams.'
            },
            {'name': 'Express.js', 'desc': 'Routing, middleware, error handling.'},
            {'name': 'REST API Design', 'desc': 'RESTful conventions, status codes, JSON APIs.'},
            {'name': 'JWT Authentication', 'desc': 'Stateless auth with JSON Web Tokens.'},
          ],
          'skills': [
            {'name': 'Node.js Core', 'completed': false},
            {'name': 'Express.js', 'completed': false},
            {'name': 'REST API Design', 'completed': false},
            {'name': 'JWT Auth', 'completed': false},
            {'name': 'MongoDB/Mongoose', 'completed': false},
          ],
          'objectives': [
            'Build a complete REST API with CRUD operations',
            'Implement JWT authentication and refresh tokens',
            'Connect to a MongoDB database',
          ],
        },
        {
          'number': 4,
          'title': 'React & Deployment',
          'status': 'locked',
          'quizScore': null,
          'estimatedWeeks': 5,
          'difficulty': 'Advanced',
          'completion': 0.0,
          'summary':
              'Build dynamic, performant UIs with React and deploy full-stack applications to production environments using modern DevOps practices.',
          'subtopics': [
            {'name': 'React Hooks', 'desc': 'useState, useEffect, custom hooks, context.'},
            {
              'name': 'State Management',
              'desc': 'Zustand or Redux Toolkit for global state.'
            },
            {'name': 'Docker Basics', 'desc': 'Containerizing apps for consistent environments.'},
            {'name': 'CI/CD', 'desc': 'Automated testing and deployment pipelines.'},
          ],
          'skills': [
            {'name': 'React Hooks', 'completed': false},
            {'name': 'Zustand/Redux', 'completed': false},
            {'name': 'Docker', 'completed': false},
            {'name': 'GitHub Actions', 'completed': false},
          ],
          'objectives': [
            'Build a full React app with global state management',
            'Containerize backend + frontend with Docker',
            'Deploy to a cloud platform with CI/CD',
          ],
        },
      ],
    },
    {
      'id': 'r2',
      'targetCareer': 'Data Scientist',
      'status': 'paused',
      'overallCompletion': 0.20,
      'activePhaseNumber': 1,
      'totalPhases': 5,
      'startDate': 'Mar 1, 2026',
      'estimatedEnd': 'Dec 1, 2026',
      'phases': [],
    },
  ];

  // ── Today's Tasks ─────────────────────────────────
  static List<Map<String, dynamic>> get todaysTasks => [
        {
          'id': 't1',
          'title': 'Read: TypeScript Handbook — Basic Types',
          'description':
              'Cover chapters 1–3 focusing on primitive types, arrays, tuples, and interfaces. Take notes on the differences from plain JavaScript.',
          'type': 'reading',
          'estimatedMinutes': 30,
          'xpReward': 25,
          'completed': false,
          'skipped': false,
        },
        {
          'id': 't2',
          'title': 'Watch: Async/Await Deep Dive',
          'description':
              'A 45-minute tutorial covering Promises, async/await patterns, and common pitfalls like forgetting await or unhandled rejections.',
          'type': 'video',
          'estimatedMinutes': 45,
          'xpReward': 35,
          'completed': false,
          'skipped': false,
        },
        {
          'id': 't3',
          'title': 'Code: Convert Callbacks to Promises',
          'description':
              'Practice exercise: refactor a provided callback-heavy module to use Promises, then convert again to async/await. Verify with unit tests.',
          'type': 'coding',
          'estimatedMinutes': 60,
          'xpReward': 50,
          'completed': false,
          'skipped': false,
        },
        {
          'id': 't4',
          'title': 'Read: TypeScript with Interfaces',
          'description':
              'Quick overview of TypeScript interfaces, optional properties, readonly modifiers, and extending interfaces for composition.',
          'type': 'reading',
          'estimatedMinutes': 20,
          'xpReward': 20,
          'completed': false,
          'skipped': false,
        },
        {
          'id': 't5',
          'title': 'Mini-Project: Type-Safe TODO List',
          'description':
              'Build a simple TODO list application in TypeScript with proper type annotations, interfaces, and generic utility functions.',
          'type': 'project',
          'estimatedMinutes': 90,
          'xpReward': 75,
          'completed': false,
          'skipped': false,
        },
      ];

  // ── Quiz Questions ────────────────────────────────
  static const List<Map<String, dynamic>> quizQuestions = [
    {
      'id': 'q1',
      'type': 'mcq',
      'question': 'What does the "async" keyword do when placed before a function declaration?',
      'options': [
        'Makes the function run in parallel with other code',
        'Always returns a Promise, even if you return a non-Promise value',
        'Prevents the function from throwing errors',
        'Runs the function on a background thread',
      ],
      'correctAnswer': 1,
      'explanation':
          'The async keyword makes a function always return a Promise. Any return value is automatically wrapped in a resolved Promise, and thrown errors become rejected Promises.',
    },
    {
      'id': 'q2',
      'type': 'truefalse',
      'question': 'In TypeScript, the "any" type completely disables type checking for that variable.',
      'correctAnswer': true,
      'explanation':
          'The "any" type effectively opts out of TypeScript\'s type system for that variable, allowing any operations without compile-time errors — use with caution!',
    },
    {
      'id': 'q3',
      'type': 'mcq',
      'question': 'Which TypeScript utility type makes all properties of a type optional?',
      'options': [
        'Readonly<T>',
        'Required<T>',
        'Partial<T>',
        'Pick<T, K>',
      ],
      'correctAnswer': 2,
      'explanation':
          'Partial<T> constructs a type with all properties of T set to optional (adding "?" to each). This is useful when you want to update only a subset of fields.',
    },
    {
      'id': 'q4',
      'type': 'code',
      'question': 'What will the following code log to the console?',
      'codeSnippet': '''async function fetchValue() {
  return 42;
}

fetchValue().then(val => console.log(val));''',
      'options': ['undefined', 'Promise { 42 }', '42', 'TypeError'],
      'correctAnswer': 2,
      'explanation':
          'An async function that returns 42 creates a Promise that resolves with 42. The .then() callback receives the resolved value (42) and logs it.',
    },
    {
      'id': 'q5',
      'type': 'mcq',
      'question':
          'What is the primary difference between TypeScript interfaces and type aliases?',
      'options': [
        'Interfaces can only describe objects; type aliases can also describe primitives and unions',
        'Type aliases support inheritance; interfaces do not',
        'Interfaces are compiled to JavaScript; type aliases are not',
        'There is no difference — they are completely interchangeable',
      ],
      'correctAnswer': 0,
      'explanation':
          'While both can describe objects, type aliases can represent primitives, unions, intersections, and tuples — things interfaces cannot. Interfaces also support declaration merging.',
    },
  ];

  // ── Resources ─────────────────────────────────────
  static const List<Map<String, dynamic>> resources = [
    {
      'id': 'res1',
      'title': 'TypeScript Official Handbook',
      'type': 'documentation',
      'platform': 'TypeScript.org',
      'difficulty': 'Intermediate',
      'duration': '8 hours',
      'rating': 4.8,
      'ratingCount': 2341,
      'verified': true,
      'bookmarked': false,
      'relevance': 98,
      'url': 'https://www.typescriptlang.org/docs/handbook/',
      'description':
          'The definitive TypeScript reference covering all language features from basic types to advanced generics, with interactive examples and playground links.',
      'tags': ['TypeScript', 'JavaScript', 'Documentation'],
    },
    {
      'id': 'res2',
      'title': 'JavaScript: The Modern Tutorial',
      'type': 'article',
      'platform': 'javascript.info',
      'difficulty': 'Intermediate',
      'duration': '45 min read',
      'rating': 4.9,
      'ratingCount': 8760,
      'verified': true,
      'bookmarked': true,
      'relevance': 92,
      'url': 'https://javascript.info',
      'description':
          'A comprehensive, regularly updated JavaScript tutorial covering everything from basics to advanced async patterns with clear examples.',
      'tags': ['JavaScript', 'ES6+', 'Async'],
    },
    {
      'id': 'res3',
      'title': 'Async JavaScript & Node.js Full Course',
      'type': 'video',
      'platform': 'YouTube',
      'difficulty': 'Intermediate',
      'duration': '4h 30m',
      'rating': 4.7,
      'ratingCount': 12450,
      'verified': true,
      'bookmarked': false,
      'relevance': 88,
      'url': 'https://youtube.com',
      'description':
          'Comprehensive video course on asynchronous JavaScript — callbacks, Promises, async/await — with real-world Node.js examples and exercises.',
      'tags': ['JavaScript', 'Async', 'Node.js', 'Video'],
    },
    {
      'id': 'res4',
      'title': 'The Complete Node.js Developer Course',
      'type': 'course',
      'platform': 'Udemy',
      'difficulty': 'Intermediate',
      'duration': '36 hours',
      'rating': 4.6,
      'ratingCount': 45231,
      'verified': true,
      'bookmarked': true,
      'relevance': 85,
      'url': 'https://udemy.com',
      'description':
          'Master Node.js from scratch with practical projects including REST APIs, real-time apps with WebSockets, authentication, and cloud deployment.',
      'tags': ['Node.js', 'Express', 'MongoDB', 'REST API'],
    },
    {
      'id': 'res5',
      'title': 'React Documentation — Learn React',
      'type': 'documentation',
      'platform': 'React.dev',
      'difficulty': 'Beginner',
      'duration': '6 hours',
      'rating': 4.9,
      'ratingCount': 9870,
      'verified': true,
      'bookmarked': false,
      'relevance': 70,
      'url': 'https://react.dev/learn',
      'description':
          'The official React documentation with interactive code sandboxes, clear explanations of hooks, and guided tutorials for building your first React app.',
      'tags': ['React', 'JavaScript', 'Frontend', 'Hooks'],
    },
  ];

  // ── Quiz phase statuses ────────────────────────────
  static const List<Map<String, dynamic>> quizPhaseStatuses = [
    {'phase': 1, 'title': 'HTML & CSS Fundamentals', 'status': 'passed', 'bestScore': 90},
    {
      'phase': 2,
      'title': 'JavaScript & TypeScript',
      'status': 'ready',
      'bestScore': null
    },
    {'phase': 3, 'title': 'Node.js & Express', 'status': 'locked', 'bestScore': null},
    {'phase': 4, 'title': 'React & Deployment', 'status': 'locked', 'bestScore': null},
  ];

  // ── Skip reasons ──────────────────────────────────
  static const List<String> skipReasons = [
    'Too easy',
    'Too hard',
    'Not relevant',
    'No time today',
    'Other',
  ];
}
