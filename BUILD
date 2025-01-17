#
# Copyright (C) 2022 Vaticle
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#

load("//:deployment.bzl", deployment_github = "deployment")
load("@rules_pkg//:pkg.bzl", "pkg_zip")
load("@vaticle_dependencies//distribution:deployment.bzl", "deployment")
load("@vaticle_dependencies//tool/checkstyle:rules.bzl", "checkstyle_test")
load("@vaticle_bazel_distribution//common:rules.bzl", "assemble_targz", "assemble_versioned", "assemble_zip", "checksum", "java_deps")
load("@vaticle_bazel_distribution//common/tgz2zip:rules.bzl", "tgz2zip")
load("@vaticle_bazel_distribution//github:rules.bzl", "deploy_github")
load("@vaticle_bazel_distribution//brew:rules.bzl", "deploy_brew")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_binary", "kt_jvm_library")
load("@io_bazel_rules_kotlin//kotlin/internal:toolchains.bzl", "define_kt_toolchain")
load("@vaticle_bazel_distribution//platform/jvm:rules.bzl", "assemble_jvm_platform")
load("@vaticle_typedb_common//test:rules.bzl", "native_typedb_artifact")
load("@vaticle_bazel_distribution//artifact:rules.bzl", "artifact_extractor")
load("@vaticle_bazel_distribution//platform:constraints.bzl", "constraint_linux_arm64", "constraint_linux_x86_64",
     "constraint_mac_arm64", "constraint_mac_x86_64", "constraint_win_x86_64")

package(default_visibility = ["//test/integration:__subpackages__"])
kt_jvm_library(
    name = "studio",
    srcs = glob(["*.kt"]),
    plugins = ["@vaticle_dependencies//builder/compose:compiler_plugin"],
    deps = [
        "//module/connection:connection",
        "//module/preference:preference",
        "//module/project:project",
        "//module/role:role",
        "//module/rule:rule",
        "//module/type:type",
        "//module/user:user",
        "//module:module",
        "//service/common:common",
        "//service/connection:connection",
        "//service/project:project",
        "//service/page:page",
        "//service/schema:schema",
        "//service:service",
        "//framework/common:common",
        "//framework/material:material",

        # External Vaticle Dependencies
        "@vaticle_typedb_common//:common",

        # External Maven Dependencies
        "@maven//:io_github_microutils_kotlin_logging_jvm",
        "@maven//:org_jetbrains_compose_foundation_foundation_desktop",
        "@maven//:org_jetbrains_compose_foundation_foundation_layout_desktop",
        "@maven//:org_jetbrains_compose_runtime_runtime_desktop",
        "@maven//:org_jetbrains_compose_ui_ui_desktop",
        "@maven//:org_jetbrains_compose_ui_ui_graphics_desktop",
        "@maven//:org_jetbrains_compose_ui_ui_text_desktop",
        "@maven//:org_jetbrains_compose_ui_ui_unit_desktop",
        "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_core_jvm",
        "@maven//:org_slf4j_slf4j_api",
    ],
    resources = ["//resources/icons/vaticle:vaticle-bot-32px"],
    tags = ["maven_coordinates=com.vaticle.typedb:typedb-studio:{pom_version}"],
)

load("@io_bazel_rules_kotlin//kotlin:core.bzl", "define_kt_toolchain")
define_kt_toolchain(
    name = "kotlin_toolchain_strict_deps",
    api_version = "1.7",
    language_version = "1.7",
    experimental_strict_kotlin_deps = "error",
)

java_binary(
    name = "studio-bin-linux-arm64",
    main_class = "com.vaticle.typedb.studio.Studio",
    runtime_deps = [
        "//:studio",
        "@maven//:org_jetbrains_skiko_skiko_awt_runtime_linux_arm64",
    ],
    classpath_resources = ["//config/logback:logback-test-xml"],
    target_compatible_with = constraint_linux_arm64,
)

java_binary(
    name = "studio-bin-linux-x86_64",
    main_class = "com.vaticle.typedb.studio.Studio",
    runtime_deps = [
        "//:studio",
        "@maven//:org_jetbrains_skiko_skiko_awt_runtime_linux_x64",
    ],
    classpath_resources = ["//config/logback:logback-test-xml"],
    target_compatible_with = constraint_linux_x86_64,
)

java_binary(
    name = "studio-bin-mac-arm64",
    main_class = "com.vaticle.typedb.studio.Studio",
    runtime_deps = [
        "//:studio",
        "@maven//:org_jetbrains_skiko_skiko_awt_runtime_macos_arm64",
    ],
    classpath_resources = ["//config/logback:logback-test-xml"],
    target_compatible_with = constraint_mac_arm64,
)

java_binary(
    name = "studio-bin-mac-x86_64",
    main_class = "com.vaticle.typedb.studio.Studio",
    runtime_deps = [
        "//:studio",
        "@maven//:org_jetbrains_skiko_skiko_awt_runtime_macos_x64",
    ],
    classpath_resources = ["//config/logback:logback-test-xml"],
    target_compatible_with = constraint_mac_x86_64,
)

java_binary(
    name = "studio-bin-windows-x86_64",
    main_class = "com.vaticle.typedb.studio.Studio",
    runtime_deps = [
        "//:studio",
        "@maven//:org_jetbrains_skiko_skiko_awt_runtime_windows_x64",
    ],
    classpath_resources = ["//config/logback:logback-test-xml"],
    target_compatible_with = constraint_win_x86_64,
)

java_deps(
    name = "assemble-deps",
    target = select({
        "@vaticle_bazel_distribution//platform:is_mac_arm64": ":studio-bin-mac-arm64",
        "@vaticle_bazel_distribution//platform:is_mac_x86_64": ":studio-bin-mac-x86_64",
        "@vaticle_bazel_distribution//platform:is_linux_arm64": ":studio-bin-linux-arm64",
        "@vaticle_bazel_distribution//platform:is_linux_x86_64": ":studio-bin-linux-x86_64",
        "@vaticle_bazel_distribution//platform:is_windows_x86_64": ":studio-bin-windows-x86_64",
        "//conditions:default": "INVALID",
    }),
    java_deps_root = "lib/",
)

assemble_files = {
    "//config/logback:logback-xml": "logback.xml",
    "//:LICENSE": "LICENSE",
}

assemble_jvm_platform(
    name = "assemble-platform",
    image_name = "TypeDB Studio",
    image_filename = "typedb-studio-" + select({
        "@vaticle_bazel_distribution//platform:is_mac_arm64": "mac-arm64",
        "@vaticle_bazel_distribution//platform:is_mac_x86_64": "mac-x86_64",
        "@vaticle_bazel_distribution//platform:is_linux_arm64": "linux-arm64",
        "@vaticle_bazel_distribution//platform:is_linux_x86_64": "linux-x86_64",
        "@vaticle_bazel_distribution//platform:is_windows_x86_64": "windows-x86_64",
        "//conditions:default": "INVALID",
    }),
    description = "TypeDB's Integrated Development Environment",
    vendor = "Vaticle Ltd",
    copyright = "Copyright (C) 2022 Vaticle",
    license_file = ":LICENSE",
    version_file = ":VERSION",
    icon = select({
        "@vaticle_bazel_distribution//platform:is_mac": "//resources/icons/vaticle:vaticle-bot-mac",
        "@vaticle_bazel_distribution//platform:is_linux": "//resources/icons/vaticle:vaticle-bot-linux",
        "@vaticle_bazel_distribution//platform:is_windows": "//resources/icons/vaticle:vaticle-bot-windows",
        "//conditions:default": "mac",
    }),
    java_deps = ":assemble-deps",
    java_deps_root = "lib/",
    main_jar_path = "com-vaticle-typedb-typedb-studio-0.0.0.jar",
    main_class = "com.vaticle.typedb.studio.Studio",
    additional_files = assemble_files,
    verbose = True,
    linux_app_category = "database",
    linux_menu_group = "Utility;Development;IDE;",
    mac_app_id = "com.vaticle.typedb.studio",
    mac_entitlements = "//config/mac:entitlements-mac-plist",
    mac_code_signing_cert = "@vaticle_apple_developer_id_application_cert//file",
    mac_deep_sign_jars_regex = ".*io-netty-netty.*",
    windows_menu_group = "TypeDB Studio",
)

# A little misleading. Because of the way our java_deps target is generated, this will actually produce a Mac runner
# if built on Mac, and fail to produce anything useful if built on Windows.
assemble_targz(
    name = "assemble-linux-targz",
    targets = [":assemble-deps", "//binary:assemble-bash-targz"],
    additional_files = assemble_files,
    output_filename = "typedb-studio-linux",
    visibility = ["//:__pkg__"],
)

genrule(
    name = "invalid-checksum",
    outs = ["invalid-checksum.txt"],
    srcs = [],
    cmd = "echo > $@",
)

label_flag(
    name = "checksum-mac-arm64",
    build_setting_default = ":invalid-checksum",
)

label_flag(
    name = "checksum-mac-x86_64",
    build_setting_default = ":invalid-checksum",
)

deploy_brew(
    name = "deploy-brew",
    snapshot = deployment['brew.snapshot'],
    release = deployment['brew.release'],
    formula = "//config/brew:typedb-studio.rb",
    file_substitutions = {
        "//:checksum-mac-arm64": "{sha256-arm64}",
        "//:checksum-mac-x86_64": "{sha256-x86_64}",
    },
    version_file = "//:VERSION",
    type = "cask",
)

checkstyle_test(
    name = "checkstyle",
    include = glob([
        "*",
        ".factory/*",
        ".circleci/**",
    ]),
    exclude = glob([
        "*.md",
        ".bazelversion",
        ".circleci/windows/*",
        "LICENSE",
        "VERSION",
        ".bazel-cache-credential.json",
        ".bazel-remote-cache.rc"
    ]),
    license_type = "agpl-header",
)

checkstyle_test(
    name = "checkstyle-license",
    include = ["LICENSE"],
    license_type = "agpl-fulltext",
)

native_typedb_artifact(
    name = "native-typedb-artifact",
    native_artifacts = {
        "@vaticle_bazel_distribution//platform:is_linux_arm64": ["@vaticle_typedb_artifact_linux-arm64//file"],
        "@vaticle_bazel_distribution//platform:is_linux_x86_64": ["@vaticle_typedb_artifact_linux-x86_64//file"],
        "@vaticle_bazel_distribution//platform:is_mac_arm64": ["@vaticle_typedb_artifact_mac-arm64//file"],
        "@vaticle_bazel_distribution//platform:is_mac_x86_64": ["@vaticle_typedb_artifact_mac-x86_64//file"],
        "@vaticle_bazel_distribution//platform:is_windows_x86_64": ["@vaticle_typedb_artifact_windows-x86_64//file"],
    },
    output = "typedb-server-native.tar.gz",
    visibility = ["//test/integration:__subpackages__"],
)

artifact_extractor(
    name = "typedb-extractor",
    artifact = ":native-typedb-artifact",
)

# Tools to be built during `bazel build //...`
filegroup(
    name = "tools",
    data = [
        "@vaticle_dependencies//distribution/artifact:create-netrc",
        "@vaticle_dependencies//tool/bazelinstall:remote_cache_setup.sh",
        "@vaticle_dependencies//tool/checkstyle:test-coverage",
        "@vaticle_dependencies//tool/release/notes:create",
    ],
)
