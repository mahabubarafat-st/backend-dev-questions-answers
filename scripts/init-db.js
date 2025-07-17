const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/backend-course', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const adminUser = {
  name: 'Admin User',
  email: 'admin@backendpro.com',
  password: 'admin123',
  role: 'admin',
  subscription: 'premium',
  subscriptionDate: new Date(),
};

const regularUser = {
  name: 'John Doe',
  email: 'user@example.com',
  password: 'password123',
  role: 'user',
  subscription: 'free',
};

const premiumUser = {
  name: 'Jane Smith',
  email: 'premium@example.com',
  password: 'password123',
  role: 'user',
  subscription: 'premium',
  subscriptionDate: new Date(),
};

// Sample blog posts
const blogPosts = [
  {
    title: 'Welcome to the Backend Developer Course',
    content: `# Welcome to Our Backend Developer Course!

We're excited to launch our comprehensive backend developer interview preparation course. This platform is designed to help you master the essential concepts, patterns, and practices that are commonly asked in backend developer interviews.

## What You'll Find Here

- **Comprehensive Question Bank**: Hundreds of carefully curated questions covering all major backend development topics
- **Detailed Explanations**: Each question comes with a thorough explanation and practical examples
- **Code Samples**: Real-world code examples to illustrate key concepts
- **Regular Updates**: We continuously add new content to keep up with industry trends

## Getting Started

1. Create your free account to access one question from each section
2. Upgrade to premium for just $5 to unlock all content
3. Track your progress as you work through the questions
4. Use the search and filtering options to focus on specific topics

We're committed to helping you succeed in your backend development career. Happy learning!`,
    category: 'announcement',
    tags: ['welcome', 'course', 'backend'],
    isPublished: true,
    featuredImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    title: 'Understanding ACID Properties in Database Transactions',
    content: `# ACID Properties in Database Transactions

One of the most fundamental concepts in database systems is the ACID properties of transactions. Understanding these properties is crucial for designing reliable database applications.

## What are ACID Properties?

ACID stands for:

- **Atomicity**: A transaction is an atomic unit that either completes entirely or fails entirely
- **Consistency**: A transaction brings the database from one valid state to another
- **Isolation**: Concurrent transactions are isolated from each other
- **Durability**: Once a transaction is committed, it remains committed even in case of system failure

## Why ACID Matters

In real-world applications, especially those handling financial data or critical information, ensuring data integrity is paramount. ACID properties provide the guarantees needed to maintain data integrity even in the face of concurrent access and system failures.

## Example in Code

\`\`\`javascript
// Example of a transaction in Node.js with Sequelize ORM
const transaction = await sequelize.transaction();

try {
  // Deduct amount from sender's account
  await Account.decrement('balance', {
    by: amount,
    where: { id: senderId },
    transaction
  });
  
  // Add amount to receiver's account
  await Account.increment('balance', {
    by: amount,
    where: { id: receiverId },
    transaction
  });
  
  // If both operations succeed, commit the transaction
  await transaction.commit();
} catch (error) {
  // If any operation fails, roll back the transaction
  await transaction.rollback();
  throw error;
}
\`\`\`

## Trade-offs

While ACID properties provide strong guarantees, they can impact performance. This is why NoSQL databases often relax some of these properties in favor of performance and scalability, following the BASE (Basically Available, Soft state, Eventually consistent) model instead.

Understanding when to prioritize ACID compliance and when to accept eventual consistency is a key skill for backend developers.`,
    category: 'tutorial',
    tags: ['databases', 'transactions', 'acid', 'sql'],
    isPublished: true,
    featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    title: 'Solving the N+1 Query Problem in ORMs',
    content: `# Solving the N+1 Query Problem in ORMs

The N+1 query problem is one of the most common performance issues in applications that use Object-Relational Mapping (ORM) libraries. Let's understand what it is and how to solve it.

## What is the N+1 Query Problem?

The N+1 query problem occurs when your code needs to load a collection of objects and their related objects. It happens when the ORM executes:

1. One query to fetch the main objects (the "1")
2. N additional queries to fetch the related objects for each of the N main objects (the "N")

This results in N+1 database queries, which can significantly impact performance as N grows.

## Example of the Problem

\`\`\`javascript
// Fetch all blog posts
const posts = await Post.findAll();

// For each post, fetch its comments (N additional queries)
for (const post of posts) {
  const comments = await Comment.findAll({
    where: { postId: post.id }
  });
  post.comments = comments;
}
\`\`\`

## Solutions

### 1. Eager Loading

Most ORMs provide a way to specify that related entities should be loaded in the same query:

\`\`\`javascript
// Single query with a JOIN to get posts and their comments
const posts = await Post.findAll({
  include: [{
    model: Comment
  }]
});
\`\`\`

### 2. Batch Loading

Instead of loading related entities one by one, load them in batches:

\`\`\`javascript
// Get all post IDs
const postIds = posts.map(post => post.id);

// Fetch all comments for all posts in a single query
const allComments = await Comment.findAll({
  where: {
    postId: {
      [Op.in]: postIds
    }
  }
});

// Organize comments by post ID
const commentsByPostId = {};
allComments.forEach(comment => {
  if (!commentsByPostId[comment.postId]) {
    commentsByPostId[comment.postId] = [];
  }
  commentsByPostId[comment.postId].push(comment);
});

// Assign comments to their respective posts
posts.forEach(post => {
  post.comments = commentsByPostId[post.id] || [];
});
\`\`\`

### 3. Using DataLoader (GraphQL)

For GraphQL APIs, the DataLoader library helps batch and cache database requests:

\`\`\`javascript
const commentLoader = new DataLoader(async (postIds) => {
  const comments = await Comment.findAll({
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  });
  
  // Group comments by post ID
  const commentsByPostId = {};
  comments.forEach(comment => {
    if (!commentsByPostId[comment.postId]) {
      commentsByPostId[comment.postId] = [];
    }
    commentsByPostId[comment.postId].push(comment);
  });
  
  // Return comments in the same order as the post IDs
  return postIds.map(id => commentsByPostId[id] || []);
});

// Usage
const post = await Post.findByPk(1);
const comments = await commentLoader.load(post.id);
\`\`\`

## Conclusion

The N+1 query problem is a common performance issue, but it can be easily solved with eager loading, batch loading, or specialized libraries like DataLoader. Being aware of this problem and knowing how to solve it is essential for writing efficient database-driven applications.`,
    category: 'tutorial',
    tags: ['databases', 'performance', 'orm', 'optimization'],
    isPublished: true,
    featuredImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    title: 'Upcoming Features: What to Expect in Our Next Update',
    content: `# Upcoming Features: What to Expect in Our Next Update

We're constantly working to improve our backend developer course platform and add new content to help you prepare for interviews. Here's a sneak peek at what's coming in our next update:

## New Content

- **System Design Section**: We're adding a comprehensive section on system design with detailed examples and case studies
- **Microservices Architecture**: In-depth questions and answers about microservices design patterns, challenges, and best practices
- **Cloud Computing**: AWS, Azure, and GCP specific questions that are commonly asked in cloud-focused roles

## Platform Improvements

- **Interactive Code Challenges**: Practice your coding skills with our new interactive challenges
- **Progress Tracking Dashboard**: A redesigned dashboard to better track your learning progress
- **Personalized Learning Path**: Get recommendations based on your strengths and areas for improvement

## Community Features

- **Discussion Forums**: Engage with other learners to discuss questions and share insights
- **Mock Interview Sessions**: Practice with peers through our new mock interview feature
- **Expert Q&A Sessions**: Regular sessions with industry experts to answer your questions

We're excited to bring these features to you in the coming weeks. Stay tuned for the official announcement!

What features would you like to see added to our platform? Let us know in the comments below.`,
    category: 'announcement',
    tags: ['updates', 'features', 'roadmap'],
    isPublished: true,
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    title: 'REST vs GraphQL: Choosing the Right API Architecture',
    content: `# REST vs GraphQL: Choosing the Right API Architecture

When building modern web applications, choosing the right API architecture is a critical decision. The two most popular options today are REST and GraphQL. Let's compare them to help you make an informed choice for your next project.

## REST: The Traditional Approach

REST (Representational State Transfer) has been the standard for API design for many years. It's an architectural style that uses standard HTTP methods and URLs to interact with resources.

### Advantages of REST

- **Simplicity**: Easy to understand and implement
- **Caching**: Leverages HTTP caching mechanisms
- **Tooling**: Mature ecosystem with extensive tooling
- **Statelessness**: Each request contains all information needed to complete it

### Disadvantages of REST

- **Overfetching**: Often returns more data than needed
- **Underfetching**: May require multiple requests to get all needed data
- **Versioning**: API versioning can become complex
- **Documentation**: Requires external tools like Swagger/OpenAPI

## GraphQL: The New Contender

GraphQL, developed by Facebook, is a query language for APIs that allows clients to request exactly the data they need.

### Advantages of GraphQL

- **Precise Data Fetching**: Clients specify exactly what data they need
- **Single Request**: Can fetch multiple resources in a single request
- **Strong Typing**: Schema provides clear contract and enables tooling
- **Introspection**: Self-documenting API

### Disadvantages of GraphQL

- **Complexity**: Steeper learning curve than REST
- **Caching**: More complex caching strategy required
- **File Uploads**: Not part of the specification (though extensions exist)
- **Rate Limiting**: More difficult to implement than with REST

## Code Comparison

### REST Example

\`\`\`javascript
// Server-side REST endpoint
app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  res.json(user);
});

app.get('/api/users/:id/posts', (req, res) => {
  const posts = getPostsByUserId(req.params.id);
  res.json(posts);
});

// Client-side REST calls
async function getUserWithPosts(userId) {
  // Two separate requests
  const userResponse = await fetch(\`/api/users/\${userId}\`);
  const user = await userResponse.json();
  
  const postsResponse = await fetch(\`/api/users/\${userId}/posts\`);
  const posts = await postsResponse.json();
  
  return { user, posts };
}
\`\`\`

### GraphQL Example

\`\`\`javascript
// Server-side GraphQL schema and resolvers
const schema = gql\`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }
  
  type Post {
    id: ID!
    title: String!
    content: String!
  }
  
  type Query {
    user(id: ID!): User
  }
\`;

const resolvers = {
  Query: {
    user: (_, { id }) => getUserById(id)
  },
  User: {
    posts: (user) => getPostsByUserId(user.id)
  }
};

// Client-side GraphQL query
async function getUserWithPosts(userId) {
  // Single request
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: \`
        query GetUserWithPosts($userId: ID!) {
          user(id: $userId) {
            id
            name
            email
            posts {
              id
              title
              content
            }
          }
        }
      \`,
      variables: { userId }
    })
  });
  
  const { data } = await response.json();
  return data;
}
\`\`\`

## When to Choose Each

### Choose REST when:

- You need simple, resource-oriented APIs
- HTTP caching is important for your application
- You want to leverage existing tools and infrastructure
- Your API consumers have bandwidth constraints

### Choose GraphQL when:

- Your clients need flexible data requirements
- You have nested and interconnected data
- You want to avoid multiple round-trips to the server
- You need strong typing and introspection

## Conclusion

Both REST and GraphQL have their strengths and weaknesses. The choice between them depends on your specific requirements, team expertise, and the nature of your application. Many modern applications even use both: REST for simple CRUD operations and GraphQL for complex data fetching.

What's your experience with REST and GraphQL? Share your thoughts in the comments!`,
    category: 'discussion',
    tags: ['api', 'rest', 'graphql', 'web-development'],
    isPublished: true,
    featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  }
];

// Course sections and questions
const courseSections = [
  {
    id: 'design-patterns',
    title: 'Design Patterns',
    description: 'Questions about common design patterns and their applications in backend development',
    icon: 'fas fa-layer-group',
    order: 1,
    freeQuestionsCount: 1,
    questions: [
      {
        id: 'inversion-of-control',
        title: 'Inversion of Control',
        question: 'Tell me about Inversion of Control and how it improves the design of code.',
        answer: `Inversion of Control (IoC) is a design principle in which custom-written portions of a computer program receive the flow of control from a generic framework. It's a way to decouple components and layers in the system.

The main benefits of IoC include:

1. **Decoupling**: Components become loosely coupled, making the system more modular.
2. **Testability**: Dependencies can be easily mocked or stubbed for testing.
3. **Flexibility**: Implementation details can be swapped without affecting dependent components.
4. **Maintainability**: Code is more maintainable as components have clear boundaries.

A common implementation of IoC is Dependency Injection (DI), where dependencies are "injected" into a component rather than the component creating or finding them.

Example in JavaScript:

\`\`\`javascript
// Without IoC
class UserService {
  constructor() {
    this.repository = new UserRepository(); // Tight coupling
  }
}

// With IoC
class UserService {
  constructor(repository) {
    this.repository = repository; // Dependency injected
  }
}

// Usage
const userRepo = new UserRepository();
const userService = new UserService(userRepo);
\`\`\`

In modern frameworks like Spring (Java), Angular, or NestJS, IoC containers manage the instantiation and lifecycle of objects, further simplifying the implementation of IoC.`,
        difficulty: 'intermediate',
        tags: ['design patterns', 'architecture', 'SOLID principles'],
        codeExample: `// Example of IoC in Node.js with dependency injection

// Without IoC
class PaymentProcessor {
  constructor() {
    this.paymentGateway = new StripeGateway();  // Tightly coupled
  }
  
  processPayment(amount) {
    return this.paymentGateway.charge(amount);
  }
}

// With IoC
class PaymentProcessor {
  constructor(paymentGateway) {
    this.paymentGateway = paymentGateway;  // Dependency injected
  }
  
  processPayment(amount) {
    return this.paymentGateway.charge(amount);
  }
}

// Usage
const stripeGateway = new StripeGateway();
const paypalGateway = new PayPalGateway();

// We can easily switch payment providers
const stripeProcessor = new PaymentProcessor(stripeGateway);
const paypalProcessor = new PaymentProcessor(paypalGateway);`,
        resources: [
          'https://martinfowler.com/articles/injection.html',
          'https://en.wikipedia.org/wiki/Inversion_of_control'
        ],
        isFree: true
      },
      {
        id: 'singleton-pattern',
        title: 'Singleton Pattern',
        question: 'Singleton is a design pattern that restricts the instantiation of a class to one single object. Writing a Thread-Safe Singleton class is not so obvious. Would you try?',
        answer: `The Singleton pattern ensures that a class has only one instance and provides a global point of access to it. This is useful when exactly one object is needed to coordinate actions across the system.

Creating a thread-safe singleton requires careful handling of instantiation to prevent race conditions where multiple threads could create separate instances.

Here are different approaches to implement a thread-safe singleton:

1. **Eager Initialization**: Create the instance when the class is loaded.
2. **Lazy Initialization with Double-Checked Locking**: Check if an instance exists before acquiring a lock, then check again inside the synchronized block.
3. **Static Holder Pattern**: Use a static inner class to hold the instance.

In JavaScript (which is single-threaded in most environments), a simple implementation would be:

\`\`\`javascript
class Singleton {
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance;
    }
    
    // Initialize properties
    this.data = [];
    Singleton.instance = this;
  }
  
  // Methods
  addData(item) {
    this.data.push(item);
  }
  
  getData() {
    return this.data;
  }
}

// Usage
const instance1 = new Singleton();
const instance2 = new Singleton();
console.log(instance1 === instance2); // true
\`\`\`

In a multi-threaded environment like Java, a thread-safe implementation would be:

\`\`\`java
public class Singleton {
    // Private static instance variable
    private static volatile Singleton instance;
    
    // Private constructor to prevent instantiation
    private Singleton() {}
    
    // Public static method for getting the instance
    public static Singleton getInstance() {
        // Double-checked locking
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
\`\`\``,
        difficulty: 'intermediate',
        tags: ['design patterns', 'creational patterns', 'concurrency'],
        codeExample: `// Thread-safe Singleton in Node.js

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    // Initialize the connection
    this.connection = {
      host: 'localhost',
      connected: false,
      connect() {
        this.connected = true;
        console.log('Connected to database');
      },
      query(sql) {
        if (!this.connected) {
          throw new Error('Not connected to database');
        }
        console.log(\`Executing query: \${sql}\`);
        return { rows: [] };
      }
    };
    
    DatabaseConnection.instance = this;
  }
  
  connect() {
    this.connection.connect();
  }
  
  query(sql) {
    return this.connection.query(sql);
  }
  
  // Static method to get the instance
  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

console.log(db1 === db2); // true - same instance

db1.connect();
db2.query('SELECT * FROM users'); // Works because it's the same instance`,
        resources: [
          'https://refactoring.guru/design-patterns/singleton',
          'https://sourcemaking.com/design_patterns/singleton'
        ],
        isFree: false
      }
    ]
  },
  {
    id: 'databases',
    title: 'Databases',
    description: 'Questions about database concepts, SQL, NoSQL, and database optimization',
    icon: 'fas fa-database',
    order: 2,
    freeQuestionsCount: 1,
    questions: [
      {
        id: 'acid',
        title: 'ACID Properties',
        question: 'ACID is an acronym that refers to Atomicity, Consistency, Isolation and Durability, 4 properties guaranteed by a database transaction in most database engines. What do you know about this topic? Would you like to elaborate?',
        answer: `ACID is a set of properties that guarantee database transactions are processed reliably. It stands for:

1. **Atomicity**: A transaction is an atomic unit that either completes entirely or fails entirely. There are no partial transactions. If any part of a transaction fails, the entire transaction is rolled back.

2. **Consistency**: A transaction brings the database from one valid state to another valid state, maintaining all predefined rules including constraints, cascades, and triggers.

3. **Isolation**: Concurrent transactions are isolated from each other, meaning that the intermediate state of a transaction is invisible to other transactions. This prevents concurrent transactions from interfering with each other.

4. **Durability**: Once a transaction is committed, it remains committed even in the case of a system failure (crash or power outage). The changes made by committed transactions are permanent.

ACID properties are particularly important in applications where data accuracy and consistency are critical, such as financial systems, booking systems, and inventory management.

Most relational database management systems (RDBMS) like PostgreSQL, MySQL, SQL Server, and Oracle provide ACID guarantees. NoSQL databases often sacrifice some ACID properties for performance and scalability, following the BASE (Basically Available, Soft state, Eventually consistent) model instead.

The level of isolation can be configured in most databases through isolation levels:
- Read Uncommitted (lowest isolation)
- Read Committed
- Repeatable Read
- Serializable (highest isolation)

Higher isolation levels provide better data consistency but may reduce concurrency and performance.`,
        difficulty: 'intermediate',
        tags: ['databases', 'transactions', 'data integrity'],
        codeExample: `-- Example of ACID transaction in SQL

BEGIN TRANSACTION;

-- Atomicity: All operations must succeed or the transaction will roll back
UPDATE accounts SET balance = balance - 100 WHERE account_id = 123;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 456;

-- Check if both operations succeeded
IF @@ERROR <> 0
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Transaction failed and rolled back';
END
ELSE
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully';
END

-- Consistency: Database constraints ensure valid states
-- For example, a CHECK constraint might prevent negative balances
-- ALTER TABLE accounts ADD CONSTRAINT check_balance CHECK (balance >= 0);

-- Isolation: Transaction isolation level determines how transactions interact
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Durability: Once committed, changes are permanent
-- This is handled by the database's logging and recovery mechanisms`,
        resources: [
          'https://en.wikipedia.org/wiki/ACID',
          'https://www.postgresql.org/docs/current/transaction-iso.html'
        ],
        isFree: true
      },
      {
        id: 'n-plus-one',
        title: 'N+1 Problem',
        question: 'The so called "N + 1 problem" is an issue that occurs when code needs to load the children of a parent-child relationship with an ORM that has lazy-loading enabled, and that therefore issues a query for the parent record, and then one query for each child record. How to fix it?',
        answer: `The N+1 problem is a common performance issue in applications that use ORMs (Object-Relational Mappers) with lazy loading. It occurs when you fetch a list of N parent records, and then for each parent, you separately fetch its child records, resulting in N+1 database queries (1 for the parent list and N for each parent's children).

For example, if you fetch 100 blog posts and then separately fetch the comments for each post, you'd make 101 database queries.

**Solutions to the N+1 problem:**

1. **Eager Loading / Preloading**: Most ORMs provide a way to specify that related entities should be loaded in the same query. This is typically done through methods like \`include\`, \`preload\`, \`join\`, or \`with\`.

2. **Batch Loading**: Instead of loading children one by one, load them in batches. Some ORMs support this natively, or you can implement it manually.

3. **Join Queries**: Use SQL joins to fetch parent and child records in a single query. This works well for one-to-one or many-to-one relationships.

4. **Subselect Strategy**: Some ORMs can use a subselect strategy where they first fetch all parents and then fetch all children that belong to those parents in a single query.

5. **DataLoader Pattern**: For GraphQL APIs, the DataLoader library helps batch and cache database requests.

The best solution depends on your specific use case, the ORM you're using, and the database structure. In general, eager loading is the most common and straightforward solution.`,
        difficulty: 'intermediate',
        tags: ['databases', 'performance', 'ORM'],
        codeExample: `// Example of N+1 problem and solution in JavaScript with Sequelize ORM

// N+1 Problem
async function getBlogsWithComments_N_Plus_1() {
  const blogs = await Blog.findAll(); // 1 query to get all blogs
  
  // For each blog, fetch its comments (N additional queries)
  for (const blog of blogs) {
    const comments = await Comment.findAll({
      where: { blogId: blog.id }
    });
    blog.comments = comments;
  }
  
  return blogs;
}

// Solution: Eager Loading
async function getBlogsWithComments_EagerLoading() {
  // Single query with a JOIN to get blogs and their comments
  const blogs = await Blog.findAll({
    include: [{
      model: Comment
    }]
  });
  
  return blogs;
}

// Solution: Batch Loading
async function getBlogsWithComments_BatchLoading() {
  const blogs = await Blog.findAll(); // 1 query to get all blogs
  
  // Get all blog IDs
  const blogIds = blogs.map(blog => blog.id);
  
  // Fetch all comments for all blogs in a single query
  const allComments = await Comment.findAll({
    where: {
      blogId: {
        [Op.in]: blogIds
      }
    }
  });
  
  // Organize comments by blog ID
  const commentsByBlogId = {};
  allComments.forEach(comment => {
    if (!commentsByBlogId[comment.blogId]) {
      commentsByBlogId[comment.blogId] = [];
    }
    commentsByBlogId[comment.blogId].push(comment);
  });
  
  // Assign comments to their respective blogs
  blogs.forEach(blog => {
    blog.comments = commentsByBlogId[blog.id] || [];
  });
  
  return blogs;
}`,
        resources: [
          'https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping',
          'https://docs.sequelize.org/en/latest/docs/eager-loading/'
        ],
        isFree: false
      }
    ]
  },
  {
    id: 'web-development',
    title: 'Web Development',
    description: 'Questions about web development concepts, REST APIs, HTTP, and more',
    icon: 'fas fa-globe',
    order: 3,
    freeQuestionsCount: 1,
    questions: [
      {
        id: 'rest-vs-soap',
        title: 'REST vs SOAP',
        question: 'REST and SOAP: when would you choose one, and when the other?',
        answer: `REST (Representational State Transfer) and SOAP (Simple Object Access Protocol) are two different approaches for web services communication. Here's a comparison and guidance on when to use each:

**SOAP:**
- A protocol with specific standards and rules
- Uses XML format exclusively
- Typically uses HTTP, but can work with other protocols like SMTP, JMS
- Has built-in error handling (fault element)
- Supports WS-Security with encryption, signatures, and authentication
- Has WS-ReliableMessaging for guaranteed message delivery
- Supports WS-AtomicTransaction for ACID transactions
- More verbose and generally slower due to XML parsing

**REST:**
- An architectural style, not a protocol
- Can use various formats (JSON, XML, HTML, plain text)
- Uses standard HTTP methods (GET, POST, PUT, DELETE)
- Leverages HTTP status codes for error handling
- Simpler to use and understand
- Generally faster and uses fewer resources
- Stateless by design

**When to choose SOAP:**
1. When formal contracts are required (WSDL)
2. When advanced security requirements exist
3. For enterprise applications requiring ACID transactions
4. When stateful operations are needed
5. In distributed computing environments with reliability requirements
6. When working with legacy systems that expect SOAP
7. When comprehensive error handling is required

**When to choose REST:**
1. For public APIs consumed by a wide range of clients
2. When bandwidth and resources are limited (mobile applications)
3. For simple CRUD operations
4. When you need high performance and scalability
5. For cloud-based services
6. When you want to leverage HTTP caching
7. For JavaScript/web clients that parse JSON easily

**Modern Trends:**
REST has become the dominant choice for most new API development, especially for public-facing APIs and microservices. SOAP is still used in enterprise environments, financial services, and legacy systems where its additional features are beneficial.

GraphQL is also emerging as an alternative to both, offering more flexibility in data retrieval than REST while being more lightweight than SOAP.`,
        difficulty: 'beginner',
        tags: ['web development', 'APIs', 'integration'],
        codeExample: `// REST API example in Node.js
const express = require('express');
const app = express();
app.use(express.json());

// REST endpoint for users
app.get('/api/users', (req, res) => {
  // Get all users
  res.json([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]);
});

app.get('/api/users/:id', (req, res) => {
  // Get user by ID
  const userId = req.params.id;
  res.json({ id: userId, name: 'John' });
});

app.post('/api/users', (req, res) => {
  // Create new user
  const newUser = req.body;
  res.status(201).json({ id: 3, ...newUser });
});

app.put('/api/users/:id', (req, res) => {
  // Update user
  const userId = req.params.id;
  const userData = req.body;
  res.json({ id: userId, ...userData });
});

app.delete('/api/users/:id', (req, res) => {
  // Delete user
  const userId = req.params.id;
  res.status(204).end();
});

app.listen(3000);

/* 
SOAP example (XML message):

<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <Authentication>
      <username>user123</username>
      <password>pass456</password>
    </Authentication>
  </soap:Header>
  <soap:Body>
    <GetUser>
      <userId>1</userId>
    </GetUser>
  </soap:Body>
</soap:Envelope>
*/`,
        resources: [
          'https://www.w3.org/TR/soap/',
          'https://restfulapi.net/'
        ],
        isFree: true
      },
      {
        id: 'api-versioning',
        title: 'API Versioning',
        question: 'How would you manage Web Services API versioning?',
        answer: `API versioning is crucial for maintaining backward compatibility while allowing your API to evolve. There are several approaches to versioning web service APIs:

**1. URI Path Versioning**
- Include the version in the URL path
- Example: \`https://api.example.com/v1/users\`
- Pros: Simple, explicit, easy to understand
- Cons: Not truly RESTful (resources shouldn't change location)

**2. Query Parameter Versioning**
- Pass the version as a query parameter
- Example: \`https://api.example.com/users?version=1\`
- Pros: Doesn't change resource URI, optional (can have a default)
- Cons: Easy to miss, often overlooked in documentation

**3. Custom Header Versioning**
- Use a custom HTTP header to specify the version
- Example: \`X-API-Version: 1\` or \`Accept-Version: 1\`
- Pros: Keeps URI clean, follows HTTP protocol design
- Cons: Less visible, harder to test in browser

**4. Accept Header Versioning**
- Use content negotiation with the Accept header
- Example: \`Accept: application/vnd.example.v1+json\`
- Pros: Most RESTful approach, uses HTTP content negotiation
- Cons: More complex, harder to test without specialized tools

**5. Content Type Versioning**
- Include version in the content type
- Example: \`Content-Type: application/vnd.example.v1+json\`
- Pros: Clear separation of concerns
- Cons: Only works for request bodies, not for GET requests

**Best Practices:**

1. **Choose One Method**: Be consistent with your versioning strategy.
2. **Never Break Backward Compatibility**: Once an API is published, maintain support for it.
3. **Version Major Changes Only**: Minor, backward-compatible changes don't need a new version.
4. **Document Deprecation Policy**: Clearly communicate how long older versions will be supported.
5. **Use Semantic Versioning**: Consider using major.minor.patch format for clarity.
6. **Provide Migration Guides**: Help users transition between versions.
7. **Consider Hypermedia (HATEOAS)**: Can reduce the need for versioning by making clients follow links rather than construct URLs.

**Which Approach to Choose?**

- **URI Path Versioning**: Best for public APIs where simplicity and discoverability matter most.
- **Header Versioning**: Better for internal APIs or when URIs need to remain stable.
- **Accept Header**: Most RESTful but more complex to implement and use.

Many major APIs (Twitter, GitHub, Stripe) use URI path versioning due to its simplicity and explicitness, despite it not being the most RESTfully pure approach.`,
        difficulty: 'intermediate',
        tags: ['web development', 'APIs', 'versioning'],
        codeExample: `// Example of API versioning in Express.js

const express = require('express');
const app = express();

// 1. URI Path Versioning
app.get('/v1/users', (req, res) => {
  res.json({ version: 'v1', users: ['John', 'Jane'] });
});

app.get('/v2/users', (req, res) => {
  res.json({ 
    version: 'v2', 
    users: [
      { id: 1, name: 'John', role: 'admin' },
      { id: 2, name: 'Jane', role: 'user' }
    ] 
  });
});

// 2. Query Parameter Versioning
app.get('/users', (req, res) => {
  const version = req.query.version || '1';
  
  if (version === '1') {
    return res.json({ version: '1', users: ['John', 'Jane'] });
  } else if (version === '2') {
    return res.json({ 
      version: '2', 
      users: [
        { id: 1, name: 'John', role: 'admin' },
        { id: 2, name: 'Jane', role: 'user' }
      ] 
    });
  }
  
  res.status(400).json({ error: 'Invalid version' });
});

// 3. Custom Header Versioning
app.get('/api/users', (req, res) => {
  const version = req.header('X-API-Version') || '1';
  
  if (version === '1') {
    return res.json({ version: '1', users: ['John', 'Jane'] });
  } else if (version === '2') {
    return res.json({ 
      version: '2', 
      users: [
        { id: 1, name: 'John', role: 'admin' },
        { id: 2, name: 'Jane', role: 'user' }
      ] 
    });
  }
  
  res.status(400).json({ error: 'Invalid version' });
});

// 4. Accept Header Versioning
app.get('/api/v2/users', (req, res) => {
  const acceptHeader = req.header('Accept');
  
  if (acceptHeader === 'application/vnd.example.v1+json') {
    return res.json({ version: '1', users: ['John', 'Jane'] });
  } else if (acceptHeader === 'application/vnd.example.v2+json') {
    return res.json({ 
      version: '2', 
      users: [
        { id: 1, name: 'John', role: 'admin' },
        { id: 2, name: 'Jane', role: 'user' }
      ] 
    });
  }
  
  // Default to latest version
  res.json({ 
    version: '2', 
    users: [
      { id: 1, name: 'John', role: 'admin' },
      { id: 2, name: 'Jane', role: 'user' }
    ] 
  });
});

app.listen(3000);`,
        resources: [
          'https://restfulapi.net/versioning/',
          'https://www.troyhunt.com/your-api-versioning-is-wrong-which-is/'
        ],
        isFree: false
      }
    ]
  }
];

// Initialize database
async function initializeDatabase() {
  try {
    // Import Post model
    const Post = require('../models/Post');
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Transaction.deleteMany({});
    await Post.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);
    const createdAdmin = await User.create({
      ...adminUser,
      password: hashedAdminPassword
    });

    console.log('Created admin user');

    // Create regular user
    const hashedUserPassword = await bcrypt.hash(regularUser.password, 10);
    const createdUser = await User.create({
      ...regularUser,
      password: hashedUserPassword
    });

    console.log('Created regular user');

    // Create premium user
    const hashedPremiumPassword = await bcrypt.hash(premiumUser.password, 10);
    const createdPremium = await User.create({
      ...premiumUser,
      password: hashedPremiumPassword
    });

    console.log('Created premium user');

    // Create course
    const course = await Course.create({
      title: 'Backend Developer Interview Questions',
      description: 'Comprehensive course covering essential backend concepts, design patterns, and interview questions to help you ace your next technical interview.',
      price: 5,
      currency: 'USD',
      sections: courseSections,
      isActive: true
    });

    console.log('Created course with sections and questions');

    // Create sample transaction
    await Transaction.create({
      userId: createdPremium._id,
      stripePaymentIntentId: 'pi_sample_' + Date.now(),
      amount: 5,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'card',
      description: 'Backend Developer Course - Premium Access',
      metadata: {
        courseId: course._id,
        userEmail: createdPremium.email
      },
      createdAt: new Date()
    });

    console.log('Created sample transaction');
    
    // Create blog posts
    for (const postData of blogPosts) {
      await Post.create({
        ...postData,
        author: createdAdmin._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Created sample blog posts');

    console.log('Database initialization complete!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@backendpro.com / admin123');
    console.log('Regular user: user@example.com / password123');
    console.log('Premium user: premium@example.com / password123');

    // Disconnect from database
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();