---
name: qt-translation-workflow
description: Set up Qt Linguist workflow with .ts files, lupdate/lrelease integration, and translation management
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [qt, i18n, translation, linguist, localization]
---

# qt-translation-workflow

Set up Qt Linguist translation workflow with .ts files and lrelease integration. This skill configures the complete internationalization pipeline for Qt applications.

## Capabilities

- Configure lupdate for string extraction
- Set up .ts translation files
- Integrate lrelease for .qm compilation
- Generate CMake translation targets
- Configure plural forms handling
- Set up context-based translations
- Generate translation status reports
- Configure Qt Linguist project files

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Qt project"
    },
    "languages": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Target language codes (e.g., ['de', 'fr', 'ja'])"
    },
    "sourceLanguage": {
      "type": "string",
      "default": "en",
      "description": "Source language code"
    },
    "translationDir": {
      "type": "string",
      "default": "translations"
    },
    "includeQml": {
      "type": "boolean",
      "default": true
    },
    "pluralForms": {
      "type": "boolean",
      "default": true
    },
    "generateCMake": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath", "languages"]
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
          "language": { "type": "string" },
          "type": { "enum": ["ts", "qm", "cmake"] }
        }
      }
    },
    "commands": {
      "type": "object",
      "properties": {
        "extract": { "type": "string" },
        "compile": { "type": "string" }
      }
    }
  },
  "required": ["success"]
}
```

## CMake Integration

```cmake
# CMakeLists.txt

find_package(Qt6 REQUIRED COMPONENTS LinguistTools)

set(TS_FILES
    translations/myapp_de.ts
    translations/myapp_fr.ts
    translations/myapp_ja.ts
)

# Create translation targets
qt_add_translations(myapp
    TS_FILES ${TS_FILES}
    QM_FILES_OUTPUT_VARIABLE QM_FILES
    LUPDATE_OPTIONS -no-obsolete -locations relative
    LRELEASE_OPTIONS -compress
)

# Add to resources
qt_add_resources(myapp "translations"
    PREFIX "/translations"
    FILES ${QM_FILES}
)
```

## Translation File Structure

```
project/
├── translations/
│   ├── myapp_de.ts
│   ├── myapp_fr.ts
│   ├── myapp_ja.ts
│   └── myapp_en.ts  # Reference
├── src/
│   ├── main.cpp
│   └── mainwindow.cpp
└── qml/
    └── main.qml
```

## Source Code Setup

### C++ Translations

```cpp
// mainwindow.cpp
#include <QCoreApplication>

MainWindow::MainWindow() {
    // Simple translation
    setWindowTitle(tr("My Application"));

    // With context
    label->setText(QCoreApplication::translate("MainWindow", "Welcome"));

    // Plural forms
    QString message = tr("%n file(s) selected", "", count);

    // With disambiguation
    QString open1 = tr("Open", "menu item");
    QString open2 = tr("Open", "window title");

    // Dynamic translation
    QString format = tr("Hello, %1!");
    label->setText(format.arg(userName));
}

// Enable retranslation
void MainWindow::changeEvent(QEvent* event) {
    if (event->type() == QEvent::LanguageChange) {
        retranslateUi();
    }
    QMainWindow::changeEvent(event);
}
```

### QML Translations

```qml
// main.qml
import QtQuick 2.15

Window {
    title: qsTr("My Application")

    Text {
        // Simple translation
        text: qsTr("Welcome to the app")
    }

    Text {
        // Plural forms
        text: qsTr("%n item(s)", "", itemCount)
    }

    Text {
        // With context
        text: qsTranslate("SettingsPage", "Language")
    }
}
```

## Translation Loading

```cpp
// main.cpp
#include <QTranslator>
#include <QLocale>

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);

    // Load system locale
    QTranslator translator;
    const QStringList uiLanguages = QLocale::system().uiLanguages();

    for (const QString &locale : uiLanguages) {
        const QString baseName = "myapp_" + QLocale(locale).name();
        if (translator.load(":/translations/" + baseName)) {
            app.installTranslator(&translator);
            break;
        }
    }

    // Or load specific language
    QTranslator germanTranslator;
    if (germanTranslator.load(":/translations/myapp_de")) {
        app.installTranslator(&germanTranslator);
    }

    return app.exec();
}
```

## Language Switching

```cpp
class LanguageManager : public QObject {
    Q_OBJECT
public:
    void setLanguage(const QString& languageCode) {
        // Remove old translator
        if (m_translator) {
            qApp->removeTranslator(m_translator);
        }

        // Load new translator
        m_translator = new QTranslator(this);
        QString path = QString(":/translations/myapp_%1").arg(languageCode);

        if (m_translator->load(path)) {
            qApp->installTranslator(m_translator);
            emit languageChanged();
        }
    }

signals:
    void languageChanged();

private:
    QTranslator* m_translator = nullptr;
};
```

## Workflow Commands

```bash
# Extract strings from source
lupdate src/*.cpp qml/*.qml -ts translations/myapp_de.ts

# Extract with options
lupdate -recursive -locations relative -no-obsolete \
    src/ qml/ -ts translations/*.ts

# Compile translations
lrelease translations/*.ts

# Open in Qt Linguist
linguist translations/myapp_de.ts
```

## Translation Status Report

```bash
# Check translation completeness
lconvert -if ts -i translations/myapp_de.ts -of csv -o status.csv

# Custom script to report status
for file in translations/*.ts; do
    total=$(grep -c '<source>' "$file")
    translated=$(grep -c 'type="finished"' "$file")
    echo "$file: $translated/$total translated"
done
```

## Best Practices

1. **Use tr() everywhere**: Mark all user-visible strings
2. **Provide context**: Use disambiguation comments
3. **Handle plurals**: Use %n with plural forms
4. **Use QString::arg()**: For dynamic content
5. **Test RTL languages**: Arabic, Hebrew support
6. **Keep translations updated**: Run lupdate in CI

## Related Skills

- `qt-cmake-project-generator` - Project setup
- `desktop-i18n` process - Full i18n workflow
- `docs-localization` - Documentation localization

## Related Agents

- `qt-cpp-specialist` - Qt implementation
- `localization-coordinator` - Translation management
