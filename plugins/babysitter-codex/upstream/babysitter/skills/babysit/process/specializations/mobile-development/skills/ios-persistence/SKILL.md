---
name: iOS Persistence (Core Data/Realm)
description: Specialized skill for iOS local data persistence solutions
version: 1.0.0
category: iOS Data Storage
slug: ios-persistence
status: active
---

# iOS Persistence Skill

## Overview

This skill provides specialized capabilities for iOS local data persistence solutions including Core Data and Realm. It enables designing data models, implementing migrations, configuring iCloud sync, and optimizing database performance.

## Allowed Tools

- `bash` - Execute xcodebuild and swift commands
- `read` - Analyze Core Data models and Realm schemas
- `write` - Generate model classes and configurations
- `edit` - Update existing persistence code
- `glob` - Search for model files and configurations
- `grep` - Search for patterns in persistence code

## Capabilities

### Core Data

1. **Model Design**
   - Design .xcdatamodel files
   - Generate NSManagedObject subclasses
   - Configure entity relationships
   - Set up fetch request templates
   - Define validation rules

2. **CRUD Operations**
   - Implement fetch requests with predicates
   - Configure sorting and sectioning
   - Handle batch operations
   - Implement cascading deletes
   - Configure uniquing constraints

3. **Migrations**
   - Configure lightweight migrations
   - Implement custom migration mappings
   - Handle version compatibility
   - Design progressive migration paths
   - Test migration scenarios

4. **CloudKit Integration**
   - Configure NSPersistentCloudKitContainer
   - Handle sync conflicts
   - Implement public/private databases
   - Configure sharing participants
   - Monitor sync status

5. **Performance Optimization**
   - Configure background contexts
   - Implement batch insert/update
   - Use NSBatchDeleteRequest
   - Configure fetch result controllers
   - Optimize memory with faulting

### Realm Swift

6. **Schema Definition**
   - Define Realm Object classes
   - Configure primary keys
   - Set up relationships (List, LinkingObjects)
   - Define indexed properties
   - Configure optional properties

7. **Queries and Filtering**
   - Implement Results queries
   - Configure sorting
   - Use predicates and filters
   - Handle live queries
   - Implement sectioned results

8. **Migrations**
   - Configure schema versions
   - Implement migration blocks
   - Handle property renaming
   - Add/remove properties
   - Transform data during migration

9. **Sync Configuration**
   - Configure Realm Sync
   - Handle conflict resolution
   - Implement offline-first patterns
   - Configure flexible sync subscriptions
   - Monitor sync progress

## Target Processes

This skill integrates with the following processes:

- `ios-core-data-implementation.js` - Core Data setup and usage
- `offline-first-architecture.js` - Offline data strategies
- `mobile-security-implementation.js` - Secure data storage

## Dependencies

### Required

- Xcode 15+
- Swift 5.9+
- iOS 17+ (for latest features)

### Optional

- Realm SDK
- CloudKit entitlements
- Core Data editor

## Configuration

### Core Data Stack

```swift
// Persistence/PersistenceController.swift
import CoreData
import CloudKit

final class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentCloudKitContainer

    init(inMemory: Bool = false) {
        container = NSPersistentCloudKitContainer(name: "MyApp")

        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }

        // Configure CloudKit
        guard let description = container.persistentStoreDescriptions.first else {
            fatalError("Failed to retrieve persistent store description")
        }

        description.cloudKitContainerOptions = NSPersistentCloudKitContainerOptions(
            containerIdentifier: "iCloud.com.example.myapp"
        )

        description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
        description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)

        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Unable to load persistent stores: \(error)")
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    // MARK: - Preview Support
    static var preview: PersistenceController = {
        let controller = PersistenceController(inMemory: true)
        // Add sample data
        return controller
    }()
}
```

### Realm Configuration

```swift
// Persistence/RealmManager.swift
import RealmSwift

final class RealmManager {
    static let shared = RealmManager()

    private init() {
        configureRealm()
    }

    private func configureRealm() {
        let config = Realm.Configuration(
            schemaVersion: 1,
            migrationBlock: { migration, oldSchemaVersion in
                if oldSchemaVersion < 1 {
                    // Migration logic
                }
            }
        )
        Realm.Configuration.defaultConfiguration = config
    }

    var realm: Realm {
        try! Realm()
    }
}
```

## Usage Examples

### Core Data Entity

```swift
// Models/Item+CoreDataClass.swift
import Foundation
import CoreData

@objc(Item)
public class Item: NSManagedObject {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Item> {
        return NSFetchRequest<Item>(entityName: "Item")
    }

    @NSManaged public var id: UUID
    @NSManaged public var title: String
    @NSManaged public var createdAt: Date
    @NSManaged public var isCompleted: Bool
    @NSManaged public var category: Category?
}

extension Item {
    static func create(
        in context: NSManagedObjectContext,
        title: String,
        category: Category? = nil
    ) -> Item {
        let item = Item(context: context)
        item.id = UUID()
        item.title = title
        item.createdAt = Date()
        item.isCompleted = false
        item.category = category
        return item
    }

    static func fetchAll(in context: NSManagedObjectContext) -> [Item] {
        let request = fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Item.createdAt, ascending: false)]
        return (try? context.fetch(request)) ?? []
    }

    static func fetchIncomplete(in context: NSManagedObjectContext) -> [Item] {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "isCompleted == NO")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Item.createdAt, ascending: false)]
        return (try? context.fetch(request)) ?? []
    }
}
```

### Core Data Repository

```swift
// Data/Repository/ItemRepository.swift
import Foundation
import CoreData
import Combine

protocol ItemRepositoryProtocol {
    func fetchItems() -> AnyPublisher<[Item], Error>
    func addItem(title: String) -> AnyPublisher<Item, Error>
    func updateItem(_ item: Item) -> AnyPublisher<Void, Error>
    func deleteItem(_ item: Item) -> AnyPublisher<Void, Error>
}

final class ItemRepository: ItemRepositoryProtocol {
    private let container: NSPersistentContainer
    private let backgroundContext: NSManagedObjectContext

    init(container: NSPersistentContainer = PersistenceController.shared.container) {
        self.container = container
        self.backgroundContext = container.newBackgroundContext()
        self.backgroundContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    func fetchItems() -> AnyPublisher<[Item], Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            self.backgroundContext.perform {
                do {
                    let items = try Item.fetchAll(in: self.backgroundContext)
                    promise(.success(items))
                } catch {
                    promise(.failure(error))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func addItem(title: String) -> AnyPublisher<Item, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            self.backgroundContext.perform {
                let item = Item.create(in: self.backgroundContext, title: title)

                do {
                    try self.backgroundContext.save()
                    promise(.success(item))
                } catch {
                    self.backgroundContext.rollback()
                    promise(.failure(error))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func updateItem(_ item: Item) -> AnyPublisher<Void, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            self.backgroundContext.perform {
                do {
                    try self.backgroundContext.save()
                    promise(.success(()))
                } catch {
                    self.backgroundContext.rollback()
                    promise(.failure(error))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func deleteItem(_ item: Item) -> AnyPublisher<Void, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            self.backgroundContext.perform {
                self.backgroundContext.delete(item)

                do {
                    try self.backgroundContext.save()
                    promise(.success(()))
                } catch {
                    self.backgroundContext.rollback()
                    promise(.failure(error))
                }
            }
        }
        .eraseToAnyPublisher()
    }
}
```

### Realm Object

```swift
// Models/TaskObject.swift
import RealmSwift

class TaskObject: Object, Identifiable {
    @Persisted(primaryKey: true) var id: ObjectId
    @Persisted var title: String = ""
    @Persisted var dueDate: Date?
    @Persisted var isCompleted: Bool = false
    @Persisted var priority: Int = 0
    @Persisted var tags: List<TagObject>
    @Persisted(originProperty: "tasks") var project: LinkingObjects<ProjectObject>

    convenience init(title: String, dueDate: Date? = nil, priority: Int = 0) {
        self.init()
        self.title = title
        self.dueDate = dueDate
        self.priority = priority
    }
}

class TagObject: Object, Identifiable {
    @Persisted(primaryKey: true) var id: ObjectId
    @Persisted(indexed: true) var name: String = ""
    @Persisted var color: String = "#000000"
}

class ProjectObject: Object, Identifiable {
    @Persisted(primaryKey: true) var id: ObjectId
    @Persisted var name: String = ""
    @Persisted var tasks: List<TaskObject>
}
```

### Realm Repository

```swift
// Data/Repository/TaskRealmRepository.swift
import Foundation
import RealmSwift
import Combine

protocol TaskRepositoryProtocol {
    func fetchTasks() -> AnyPublisher<[TaskObject], Error>
    func addTask(_ task: TaskObject) -> AnyPublisher<Void, Error>
    func updateTask(_ task: TaskObject, with updates: (TaskObject) -> Void) -> AnyPublisher<Void, Error>
    func deleteTask(_ task: TaskObject) -> AnyPublisher<Void, Error>
}

final class TaskRealmRepository: TaskRepositoryProtocol {
    private let realm: Realm

    init(realm: Realm = RealmManager.shared.realm) {
        self.realm = realm
    }

    func fetchTasks() -> AnyPublisher<[TaskObject], Error> {
        Just(Array(realm.objects(TaskObject.self).sorted(byKeyPath: "dueDate")))
            .setFailureType(to: Error.self)
            .eraseToAnyPublisher()
    }

    func addTask(_ task: TaskObject) -> AnyPublisher<Void, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            do {
                try self.realm.write {
                    self.realm.add(task)
                }
                promise(.success(()))
            } catch {
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }

    func updateTask(_ task: TaskObject, with updates: (TaskObject) -> Void) -> AnyPublisher<Void, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            do {
                try self.realm.write {
                    updates(task)
                }
                promise(.success(()))
            } catch {
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }

    func deleteTask(_ task: TaskObject) -> AnyPublisher<Void, Error> {
        Future { [weak self] promise in
            guard let self = self else { return }

            do {
                try self.realm.write {
                    self.realm.delete(task)
                }
                promise(.success(()))
            } catch {
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }
}
```

## Quality Gates

### Data Integrity

- All entities have proper validation
- Migrations tested on real data
- Relationship integrity maintained
- No orphaned data

### Performance

- Fetch requests optimized with limits
- Background contexts for heavy operations
- Batch operations for bulk changes
- Proper indexing on frequently queried properties

### Testing

- Unit tests for repositories
- Migration tests with sample data
- Concurrency tests for thread safety

## Related Skills

- `swift-swiftui` - iOS app development
- `mobile-security` - Secure data storage
- `offline-storage` - Cross-platform offline patterns

## Version History

- 1.0.0 - Initial release with Core Data and Realm support
