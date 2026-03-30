---
name: qt-test-fixture-generator
description: Generate Qt Test fixtures with mock QObject signals and slots, data-driven tests, and GUI testing setup
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [qt, testing, unit-test, mock, fixtures]
---

# qt-test-fixture-generator

Generate Qt Test fixtures with mock QObject signals and slots, data-driven tests, and GUI testing setup. This skill creates comprehensive test infrastructure for Qt applications.

## Capabilities

- Generate QTest-based test fixtures
- Create mock QObjects with signal/slot support
- Set up data-driven tests with QFETCH
- Configure GUI testing with QTestLib
- Generate test doubles for Qt classes
- Set up benchmark tests
- Configure test coverage reporting
- Generate CMake test integration

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Qt project"
    },
    "classToTest": {
      "type": "string",
      "description": "Name of the class to generate tests for"
    },
    "testType": {
      "enum": ["unit", "integration", "gui", "benchmark"],
      "default": "unit"
    },
    "mockDependencies": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Classes to mock"
    },
    "dataProviders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "testName": { "type": "string" },
          "columns": { "type": "array" },
          "rows": { "type": "array" }
        }
      }
    },
    "generateCoverage": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath", "classToTest"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["test", "mock", "cmake"] }
        }
      }
    },
    "runCommand": { "type": "string" }
  },
  "required": ["success"]
}
```

## Generated Test Fixture

```cpp
// tst_mywidget.cpp
#include <QtTest/QtTest>
#include <QSignalSpy>
#include "mywidget.h"
#include "mockservice.h"

class tst_MyWidget : public QObject
{
    Q_OBJECT

private slots:
    // Test lifecycle
    void initTestCase();      // Before all tests
    void cleanupTestCase();   // After all tests
    void init();              // Before each test
    void cleanup();           // After each test

    // Unit tests
    void testConstructor();
    void testSetValue();
    void testSetValue_data();  // Data provider
    void testSignalEmission();

    // GUI tests
    void testButtonClick();
    void testKeyboardInput();

    // Benchmark
    void benchmarkCalculation();

private:
    MyWidget* m_widget;
    MockService* m_mockService;
};

void tst_MyWidget::initTestCase()
{
    // One-time setup
    qDebug() << "Starting MyWidget tests";
}

void tst_MyWidget::cleanupTestCase()
{
    // One-time cleanup
}

void tst_MyWidget::init()
{
    // Create fresh instances for each test
    m_mockService = new MockService(this);
    m_widget = new MyWidget(m_mockService);
}

void tst_MyWidget::cleanup()
{
    delete m_widget;
    delete m_mockService;
    m_widget = nullptr;
    m_mockService = nullptr;
}

void tst_MyWidget::testConstructor()
{
    QVERIFY(m_widget != nullptr);
    QCOMPARE(m_widget->value(), 0);
    QVERIFY(m_widget->isEnabled());
}

void tst_MyWidget::testSetValue_data()
{
    // Data-driven test setup
    QTest::addColumn<int>("input");
    QTest::addColumn<int>("expected");
    QTest::addColumn<bool>("shouldEmitSignal");

    QTest::newRow("zero") << 0 << 0 << false;
    QTest::newRow("positive") << 42 << 42 << true;
    QTest::newRow("negative") << -10 << -10 << true;
    QTest::newRow("max") << INT_MAX << INT_MAX << true;
}

void tst_MyWidget::testSetValue()
{
    // Fetch test data
    QFETCH(int, input);
    QFETCH(int, expected);
    QFETCH(bool, shouldEmitSignal);

    QSignalSpy spy(m_widget, &MyWidget::valueChanged);

    m_widget->setValue(input);

    QCOMPARE(m_widget->value(), expected);
    QCOMPARE(spy.count(), shouldEmitSignal ? 1 : 0);
}

void tst_MyWidget::testSignalEmission()
{
    QSignalSpy spy(m_widget, &MyWidget::valueChanged);
    QVERIFY(spy.isValid());

    m_widget->setValue(100);

    QCOMPARE(spy.count(), 1);
    QList<QVariant> arguments = spy.takeFirst();
    QCOMPARE(arguments.at(0).toInt(), 100);
}

void tst_MyWidget::testButtonClick()
{
    // GUI testing
    QPushButton* button = m_widget->findChild<QPushButton*>("submitButton");
    QVERIFY(button != nullptr);

    QSignalSpy spy(m_widget, &MyWidget::submitted);

    QTest::mouseClick(button, Qt::LeftButton);

    QCOMPARE(spy.count(), 1);
}

void tst_MyWidget::testKeyboardInput()
{
    QLineEdit* input = m_widget->findChild<QLineEdit*>("nameInput");
    QVERIFY(input != nullptr);

    input->setFocus();
    QTest::keyClicks(input, "Hello World");

    QCOMPARE(input->text(), QString("Hello World"));

    // Test keyboard shortcut
    QTest::keyClick(m_widget, Qt::Key_S, Qt::ControlModifier);
    // Verify save action triggered
}

void tst_MyWidget::benchmarkCalculation()
{
    QBENCHMARK {
        m_widget->performCalculation();
    }
}

QTEST_MAIN(tst_MyWidget)
#include "tst_mywidget.moc"
```

## Mock Object

```cpp
// mockservice.h
#include <QObject>

class MockService : public QObject
{
    Q_OBJECT

public:
    explicit MockService(QObject* parent = nullptr) : QObject(parent) {}

    // Track method calls
    int fetchDataCallCount() const { return m_fetchDataCalls; }
    void resetCalls() { m_fetchDataCalls = 0; }

    // Configure return values
    void setFetchDataResult(const QString& result) { m_fetchDataResult = result; }

public slots:
    QString fetchData(int id) {
        m_fetchDataCalls++;
        m_lastFetchId = id;
        emit dataRequested(id);
        return m_fetchDataResult;
    }

signals:
    void dataRequested(int id);

public:
    int lastFetchId() const { return m_lastFetchId; }

private:
    int m_fetchDataCalls = 0;
    int m_lastFetchId = -1;
    QString m_fetchDataResult = "mock result";
};
```

## CMake Integration

```cmake
# tests/CMakeLists.txt
find_package(Qt6 REQUIRED COMPONENTS Test)

enable_testing()

# Add test executable
add_executable(tst_mywidget
    tst_mywidget.cpp
    mockservice.h
)

target_link_libraries(tst_mywidget PRIVATE
    Qt6::Test
    MyAppLib  # Library under test
)

# Register with CTest
add_test(NAME tst_mywidget COMMAND tst_mywidget)

# Coverage (with gcov)
if(ENABLE_COVERAGE)
    target_compile_options(tst_mywidget PRIVATE --coverage)
    target_link_options(tst_mywidget PRIVATE --coverage)
endif()
```

## Running Tests

```bash
# Run all tests
ctest --test-dir build

# Run specific test
./build/tests/tst_mywidget

# Run with verbose output
./build/tests/tst_mywidget -v1

# Run specific test function
./build/tests/tst_mywidget testSetValue

# Run data-driven test with specific data row
./build/tests/tst_mywidget testSetValue:positive

# Output XML for CI
./build/tests/tst_mywidget -o results.xml,xml
```

## Best Practices

1. **One assertion per test**: Keep tests focused
2. **Use QSignalSpy**: Verify signal emissions
3. **Use data-driven tests**: Avoid code duplication
4. **Mock dependencies**: Isolate unit under test
5. **Test edge cases**: Boundary values, null inputs
6. **Name tests clearly**: Describe expected behavior

## Related Skills

- `qt-cmake-project-generator` - Project setup
- `desktop-unit-testing` process - Testing workflow
- `cross-platform-test-matrix` - CI testing

## Related Agents

- `qt-cpp-specialist` - Qt expertise
- `desktop-test-architect` - Test strategy
