---
name: qt-qml-component-generator
description: Generate QML components with proper property bindings, signal/slot connections, and Qt Quick Controls integration
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [qt, qml, quick, ui, components]
---

# qt-qml-component-generator

Generate QML components with proper property bindings, signal/slot connections, and Qt Quick Controls integration. This skill creates well-structured QML components following Qt best practices.

## Capabilities

- Generate QML components with property bindings
- Create custom QML types with proper registration
- Set up signal/slot connections between QML and C++
- Configure Qt Quick Controls styling
- Generate model/view components (ListView, GridView)
- Create reusable component libraries
- Set up QML module structure
- Generate TypeScript-like type annotations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Qt project"
    },
    "componentName": {
      "type": "string",
      "description": "Name of the QML component"
    },
    "componentType": {
      "enum": ["item", "control", "popup", "view", "delegate", "singleton"],
      "default": "item"
    },
    "properties": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "defaultValue": { "type": "string" },
          "readonly": { "type": "boolean" }
        }
      }
    },
    "signals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "parameters": { "type": "array" }
        }
      }
    },
    "cppBackend": {
      "type": "boolean",
      "description": "Generate C++ backend class",
      "default": false
    },
    "useControls": {
      "enum": ["none", "basic", "material", "universal", "fusion"],
      "default": "basic"
    }
  },
  "required": ["projectPath", "componentName"]
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
          "type": { "enum": ["qml", "cpp", "cmake"] }
        }
      }
    },
    "registrationCode": {
      "type": "string",
      "description": "C++ code to register the component"
    }
  },
  "required": ["success"]
}
```

## Generated QML Component Example

```qml
// CustomButton.qml
import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Control {
    id: root

    // Properties
    property string text: ""
    property color backgroundColor: "#2196F3"
    property color textColor: "white"
    property bool loading: false
    readonly property bool pressed: mouseArea.pressed

    // Signals
    signal clicked()
    signal pressAndHold()

    // Size hints
    implicitWidth: Math.max(implicitBackgroundWidth + leftPadding + rightPadding,
                            implicitContentWidth + leftPadding + rightPadding)
    implicitHeight: Math.max(implicitBackgroundHeight + topPadding + bottomPadding,
                             implicitContentHeight + topPadding + bottomPadding)

    padding: 12

    // Background
    background: Rectangle {
        radius: 4
        color: root.pressed ? Qt.darker(root.backgroundColor, 1.2) : root.backgroundColor

        Behavior on color {
            ColorAnimation { duration: 100 }
        }
    }

    // Content
    contentItem: RowLayout {
        spacing: 8

        BusyIndicator {
            visible: root.loading
            running: root.loading
            Layout.preferredWidth: 20
            Layout.preferredHeight: 20
        }

        Text {
            text: root.text
            color: root.textColor
            font.pixelSize: 14
            font.weight: Font.Medium
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            Layout.fillWidth: true
        }
    }

    // Interaction
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        enabled: !root.loading
        onClicked: root.clicked()
        onPressAndHold: root.pressAndHold()
    }
}
```

## C++ Backend Integration

```cpp
// custombutton.h
#ifndef CUSTOMBUTTON_H
#define CUSTOMBUTTON_H

#include <QObject>
#include <QQmlEngine>

class CustomButtonBackend : public QObject
{
    Q_OBJECT
    QML_ELEMENT

    Q_PROPERTY(QString text READ text WRITE setText NOTIFY textChanged)
    Q_PROPERTY(bool loading READ loading WRITE setLoading NOTIFY loadingChanged)

public:
    explicit CustomButtonBackend(QObject *parent = nullptr);

    QString text() const;
    void setText(const QString &text);

    bool loading() const;
    void setLoading(bool loading);

signals:
    void textChanged();
    void loadingChanged();
    void clicked();

public slots:
    void handleClick();

private:
    QString m_text;
    bool m_loading = false;
};

#endif // CUSTOMBUTTON_H
```

## QML Module Structure

```
qml/
├── MyComponents/
│   ├── qmldir
│   ├── CustomButton.qml
│   ├── CustomTextField.qml
│   └── CustomDialog.qml
└── main.qml
```

```
# qmldir
module MyComponents
CustomButton 1.0 CustomButton.qml
CustomTextField 1.0 CustomTextField.qml
CustomDialog 1.0 CustomDialog.qml
```

## CMake QML Module

```cmake
qt_add_qml_module(myapp
    URI MyComponents
    VERSION 1.0
    QML_FILES
        qml/MyComponents/CustomButton.qml
        qml/MyComponents/CustomTextField.qml
    SOURCES
        src/custombutton.cpp
        src/custombutton.h
)
```

## Model/View Component

```qml
// UserListView.qml
import QtQuick 2.15
import QtQuick.Controls 2.15

ListView {
    id: root

    property alias model: root.model
    signal itemSelected(int index, var data)

    clip: true
    spacing: 4

    delegate: ItemDelegate {
        width: ListView.view.width
        height: 60

        contentItem: Row {
            spacing: 12

            Image {
                source: model.avatar
                width: 48
                height: 48
                fillMode: Image.PreserveAspectCrop
            }

            Column {
                anchors.verticalCenter: parent.verticalCenter

                Text {
                    text: model.name
                    font.bold: true
                }

                Text {
                    text: model.email
                    color: "gray"
                    font.pixelSize: 12
                }
            }
        }

        onClicked: root.itemSelected(index, model)
    }

    ScrollBar.vertical: ScrollBar {}
}
```

## Best Practices

1. **Use property bindings**: Avoid imperative updates
2. **Define proper interfaces**: Clear properties and signals
3. **Use implicit size**: Let components size themselves
4. **Separate logic from UI**: Use C++ for complex logic
5. **Follow naming conventions**: PascalCase for components
6. **Use Qt Quick Controls**: Consistent platform look

## Related Skills

- `qt-cmake-project-generator` - Project setup
- `qt-translation-workflow` - Internationalization
- `qt-widget-accessibility-audit` - Accessibility

## Related Agents

- `qt-cpp-specialist` - Qt/C++ expertise
- `desktop-ux-analyst` - UX review
