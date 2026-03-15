---
name: Room Database
description: Expert skill for Android Room persistence library
version: 1.0.0
category: Android Data Storage
slug: android-room
status: active
---

# Room Database Skill

## Overview

This skill provides expert capabilities for Android Room persistence library. It enables designing database schemas, implementing DAOs, configuring migrations, and integrating with modern Android architecture components.

## Allowed Tools

- `bash` - Execute Gradle commands and Android build tools
- `read` - Analyze Room entities and DAO files
- `write` - Generate Room database components
- `edit` - Update existing Room configurations
- `glob` - Search for database-related files
- `grep` - Search for patterns in database code

## Capabilities

### Entity Design

1. **Entity Definition**
   - Define @Entity classes with proper annotations
   - Configure primary keys (single and composite)
   - Set up foreign key relationships
   - Configure indices for query optimization
   - Implement embedded objects

2. **Type Converters**
   - Create @TypeConverter for custom types
   - Handle Date/Time conversions
   - Convert enums to database types
   - Serialize complex objects to JSON
   - Configure global type converters

### DAO Implementation

3. **Query Methods**
   - Write @Query annotations with SQL
   - Implement @Insert, @Update, @Delete
   - Configure conflict strategies
   - Create complex JOIN queries
   - Implement pagination queries

4. **Reactive Queries**
   - Return Flow for reactive updates
   - Configure LiveData return types
   - Implement one-shot suspend functions
   - Handle nullable results
   - Create parameterized queries

### Database Configuration

5. **Database Setup**
   - Configure @Database annotation
   - Set up database builder
   - Configure pre-populated databases
   - Implement multiple databases
   - Configure in-memory databases for testing

6. **Migrations**
   - Implement Migration objects
   - Configure auto-migrations
   - Handle destructive migrations
   - Test migrations with MigrationTestHelper
   - Design fallback strategies

### Integration

7. **Hilt Integration**
   - Provide database with @Singleton
   - Inject DAOs into repositories
   - Configure database scopes
   - Handle multi-module setups

8. **Repository Pattern**
   - Implement repository interfaces
   - Handle offline-first logic
   - Configure caching strategies
   - Implement sync mechanisms

## Target Processes

This skill integrates with the following processes:

- `android-room-database.js` - Room implementation
- `offline-first-architecture.js` - Offline data strategies
- `mobile-security-implementation.js` - Secure data storage

## Dependencies

### Required

- Android Studio
- Room 2.6+
- Kotlin 1.9+
- KSP or KAPT

### Optional

- Hilt for dependency injection
- Kotlin Coroutines
- Paging 3 library

## Configuration

### Gradle Setup

```kotlin
// build.gradle.kts (app)
plugins {
    id("com.google.devtools.ksp")
}

dependencies {
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // Optional - Paging 3 Integration
    implementation(libs.room.paging)

    // Testing
    testImplementation(libs.room.testing)
}
```

### Version Catalog

```toml
# gradle/libs.versions.toml
[versions]
room = "2.6.1"

[libraries]
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
room-paging = { group = "androidx.room", name = "room-paging", version.ref = "room" }
room-testing = { group = "androidx.room", name = "room-testing", version.ref = "room" }
```

## Usage Examples

### Entity Definition

```kotlin
// data/local/entity/UserEntity.kt
package com.example.app.data.local.entity

import androidx.room.*

@Entity(
    tableName = "users",
    indices = [
        Index(value = ["email"], unique = true),
        Index(value = ["created_at"])
    ]
)
data class UserEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "email")
    val email: String,

    @ColumnInfo(name = "display_name")
    val displayName: String,

    @ColumnInfo(name = "avatar_url")
    val avatarUrl: String?,

    @ColumnInfo(name = "created_at")
    val createdAt: Long,

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long,

    @Embedded(prefix = "settings_")
    val settings: UserSettings
)

data class UserSettings(
    @ColumnInfo(name = "notifications_enabled")
    val notificationsEnabled: Boolean = true,

    @ColumnInfo(name = "theme")
    val theme: String = "system"
)
```

### Entity with Relations

```kotlin
// data/local/entity/PostEntity.kt
package com.example.app.data.local.entity

import androidx.room.*

@Entity(
    tableName = "posts",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["author_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["author_id"])]
)
data class PostEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "author_id")
    val authorId: String,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "content")
    val content: String,

    @ColumnInfo(name = "published_at")
    val publishedAt: Long?,

    @ColumnInfo(name = "is_draft")
    val isDraft: Boolean = true
)

// Relation class for queries
data class PostWithAuthor(
    @Embedded val post: PostEntity,
    @Relation(
        parentColumn = "author_id",
        entityColumn = "id"
    )
    val author: UserEntity
)
```

### Type Converters

```kotlin
// data/local/converter/Converters.kt
package com.example.app.data.local.converter

import androidx.room.TypeConverter
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): LocalDateTime? {
        return value?.let {
            LocalDateTime.ofInstant(Instant.ofEpochMilli(it), ZoneId.systemDefault())
        }
    }

    @TypeConverter
    fun toTimestamp(date: LocalDateTime?): Long? {
        return date?.atZone(ZoneId.systemDefault())?.toInstant()?.toEpochMilli()
    }

    @TypeConverter
    fun fromStringList(value: List<String>?): String? {
        return value?.joinToString(",")
    }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.split(",")?.map { it.trim() }
    }
}
```

### DAO Implementation

```kotlin
// data/local/dao/UserDao.kt
package com.example.app.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY display_name ASC")
    fun observeAllUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE id = :userId")
    fun observeUserById(userId: String): Flow<UserEntity?>

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<UserEntity>)

    @Update
    suspend fun updateUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUserById(userId: String)

    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()

    @Transaction
    suspend fun replaceAllUsers(users: List<UserEntity>) {
        deleteAllUsers()
        insertUsers(users)
    }
}
```

### DAO with Relations

```kotlin
// data/local/dao/PostDao.kt
package com.example.app.data.local.dao

import androidx.room.*
import androidx.paging.PagingSource
import kotlinx.coroutines.flow.Flow

@Dao
interface PostDao {
    @Transaction
    @Query("SELECT * FROM posts WHERE is_draft = 0 ORDER BY published_at DESC")
    fun observePublishedPostsWithAuthor(): Flow<List<PostWithAuthor>>

    @Transaction
    @Query("SELECT * FROM posts WHERE is_draft = 0 ORDER BY published_at DESC")
    fun getPublishedPostsPagingSource(): PagingSource<Int, PostWithAuthor>

    @Transaction
    @Query("SELECT * FROM posts WHERE id = :postId")
    suspend fun getPostWithAuthor(postId: String): PostWithAuthor?

    @Query("SELECT * FROM posts WHERE author_id = :authorId ORDER BY published_at DESC")
    fun observePostsByAuthor(authorId: String): Flow<List<PostEntity>>

    @Query("""
        SELECT * FROM posts
        WHERE title LIKE '%' || :query || '%'
           OR content LIKE '%' || :query || '%'
        ORDER BY published_at DESC
    """)
    suspend fun searchPosts(query: String): List<PostEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPost(post: PostEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPosts(posts: List<PostEntity>)

    @Update
    suspend fun updatePost(post: PostEntity)

    @Query("UPDATE posts SET is_draft = :isDraft WHERE id = :postId")
    suspend fun updateDraftStatus(postId: String, isDraft: Boolean)

    @Delete
    suspend fun deletePost(post: PostEntity)
}
```

### Database Definition

```kotlin
// data/local/AppDatabase.kt
package com.example.app.data.local

import androidx.room.*
import com.example.app.data.local.converter.Converters
import com.example.app.data.local.dao.PostDao
import com.example.app.data.local.dao.UserDao
import com.example.app.data.local.entity.PostEntity
import com.example.app.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        PostEntity::class
    ],
    version = 2,
    autoMigrations = [
        AutoMigration(from = 1, to = 2)
    ],
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun postDao(): PostDao
}
```

### Hilt Module

```kotlin
// di/DatabaseModule.kt
package com.example.app.di

import android.content.Context
import androidx.room.Room
import com.example.app.data.local.AppDatabase
import com.example.app.data.local.dao.PostDao
import com.example.app.data.local.dao.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideUserDao(database: AppDatabase): UserDao = database.userDao()

    @Provides
    fun providePostDao(database: AppDatabase): PostDao = database.postDao()
}
```

### Repository Implementation

```kotlin
// data/repository/UserRepositoryImpl.kt
package com.example.app.data.repository

import com.example.app.data.local.dao.UserDao
import com.example.app.data.local.entity.UserEntity
import com.example.app.data.remote.api.UserApi
import com.example.app.domain.model.User
import com.example.app.domain.repository.UserRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userApi: UserApi
) : UserRepository {

    override fun observeUsers(): Flow<List<User>> {
        return userDao.observeAllUsers().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun observeUser(userId: String): Flow<User?> {
        return userDao.observeUserById(userId).map { it?.toDomain() }
    }

    override suspend fun refreshUsers() {
        val remoteUsers = userApi.getUsers()
        val entities = remoteUsers.map { it.toEntity() }
        userDao.replaceAllUsers(entities)
    }

    override suspend fun getUser(userId: String): User? {
        return userDao.getUserById(userId)?.toDomain()
    }
}

// Extension functions for mapping
private fun UserEntity.toDomain() = User(
    id = id,
    email = email,
    displayName = displayName,
    avatarUrl = avatarUrl
)
```

## Quality Gates

### Data Integrity

- Foreign key constraints properly configured
- Indices on frequently queried columns
- Unique constraints where appropriate
- Proper cascade delete behavior

### Performance

- Queries optimized with EXPLAIN
- Pagination for large datasets
- Background thread execution
- Proper indexing strategy

### Testing

- DAO tests with in-memory database
- Migration tests
- Repository integration tests

## Related Skills

- `kotlin-compose` - Android UI development
- `offline-storage` - Cross-platform patterns
- `mobile-security` - Encrypted databases

## Version History

- 1.0.0 - Initial release with Room 2.6 support
