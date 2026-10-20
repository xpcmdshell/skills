# Deep modules and journey tests: worked examples

These fictional examples explain assessment principles, not required architectures. The Python-like code is illustrative, not executable project code. Public interfaces and tests are shown; hidden implementation responsibilities are stated explicitly so the examples do not rely on another repository.

A deep module hides substantial complexity behind an interface suited to its consumers. It need not be a class, have one method, accept an options object, or complete a journey in one call. An exported function is not automatically a good abstraction.

For each example, assess two independent properties:

1. Does the public interface keep implementation complexity out of callers?
2. Does the automated test execute real behavior and assert the intended user outcome?

## 1. Stateless operation: importing a contact file

### User intent

Import a vendor CSV into an address book. Invalid input must not leave a partially imported address book.

### Public boundary

```python
def import_contacts(source: Path, address_book: Path) -> ImportSummary:
    """Validate and atomically import contacts into an address book."""
```

The module owns CSV decoding, required-column checks, normalization, duplicate handling under its documented policy, database transactions, and actionable error reporting. Callers choose the file and destination; they do not coordinate validation and commit.

A command adapter parses two paths and calls this operation. An HTTP upload adapter could call the same operation after receiving a file. Neither adapter should implement the import algorithm.

### Journey tests

```python
def test_imported_contacts_can_be_read(tmp_path):
    source = tmp_path / "contacts.csv"
    source.write_text("name,email\nAda,ada@example.test\n")
    book = tmp_path / "address-book.sqlite"

    summary = import_contacts(source, book)

    assert summary.imported == 1
    assert list_contacts(book) == [Contact("Ada", "ada@example.test")]


def test_invalid_import_preserves_existing_contacts(tmp_path):
    book = tmp_path / "address-book.sqlite"
    initial = tmp_path / "initial.csv"
    initial.write_text("name,email\nAda,ada@example.test\n")
    import_contacts(initial, book)

    invalid = tmp_path / "invalid.csv"
    invalid.write_text("name,email\nGrace,grace@example.test\nMissing email,\n")

    with raises(InvalidContact):
        import_contacts(invalid, book)

    assert list_contacts(book) == [Contact("Ada", "ada@example.test")]
```

`list_contacts` is the address book's public read operation, not a test-only inspection hook. Tests use real CSV files and a real temporary database. No parser, validation, or database operation is mocked. They establish usable persisted results and atomic failure behavior, not just a successful return value.

### Counterexample

```python
rows = decode_csv(source)
contacts = normalize_rows(rows)
validate_contacts(contacts)
transaction = begin_transaction(book)
insert_contacts(transaction, contacts)
commit(transaction)
```

If both the CLI and tests must assemble these steps, importing is not encapsulated. Testing that choreography in the test does not establish that the CLI performs it correctly. These helpers may be appropriate private implementation details; the problem is handing their coordination to ordinary consumers.

## 2. Stateful interface: editing a document

### User intent

Edit a document, undo an edit, save, and reopen it without losing the retained changes.

### Public boundary

```python
class Document:
    @classmethod
    def open(cls, path: Path) -> Document: ...
    def replace(self, start: int, end: int, text: str) -> None: ...
    def undo(self) -> None: ...
    def save(self) -> None: ...
    @property
    def text(self) -> str: ...
```

The module owns edit validation, undo bookkeeping, file decoding/encoding, and safe persistence. The caller legitimately owns which edits the user requests and when to save. A sequence of public calls is appropriate: it represents user choices, not leaked implementation steps.

### Journey test

```python
def test_edit_undo_save_and_reopen(tmp_path):
    path = tmp_path / "notes.txt"
    path.write_text("Hello world")
    document = Document.open(path)

    document.replace(6, 11, "team")
    document.replace(0, 5, "Goodbye")
    document.undo()
    document.save()

    reopened = Document.open(path)
    assert reopened.text == "Hello team"
```

This uses the real edit engine, undo history, and filesystem. It does not manipulate internal buffers or construct undo records. It proves document behavior, not keyboard shortcut wiring or visual rendering. Those distinct outcomes require their own evidence when included in the project's agreed journeys.

Do not recommend replacing this interface with `run_document_journey(options)`. The stateful public operations match the domain.

## 3. Composable library: selecting and packaging files

### User intent

A library consumer creates an archive containing selected text files, preserves their relative names, then extracts it successfully.

### Public boundary

```python
def select_files(root: Path, pattern: str) -> FileSelection: ...
def create_archive(selection: FileSelection, destination: Path) -> None: ...
def extract_archive(archive: Path, destination: Path) -> None: ...
```

The selection module owns traversal, pattern matching, and relative-path representation. The archive module owns archive encoding, resource management, and extraction path validation. The consumer chooses what to select and which operation to perform with that selection. A file selection is a supported domain value, not an internal archive record.

### Journey test

```python
def test_selected_files_survive_archive_round_trip(tmp_path):
    source = tmp_path / "source"
    (source / "notes").mkdir(parents=True)
    (source / "notes" / "meeting.txt").write_text("Decisions")
    (source / "photo.bin").write_bytes(b"not selected")
    archive = tmp_path / "notes.zip"
    restored = tmp_path / "restored"

    selection = select_files(source, pattern="**/*.txt")
    create_archive(selection, archive)
    extract_archive(archive, restored)

    restored_names = sorted(
        path.relative_to(restored).as_posix()
        for path in restored.rglob("*")
        if path.is_file()
    )
    assert restored_names == ["notes/meeting.txt"]
    assert (restored / "notes" / "meeting.txt").read_text() == "Decisions"
```

This exercises real selection, archive creation, extraction, and filesystem output. It does not mock the codec or manually write archive headers.

Composition is intentional here. Do not demand a facade that combines every possible selection and archive operation. Conversely, making callers compute archive offsets, encode headers, or coordinate resource cleanup would expose implementation complexity rather than useful consumer choices.

The round-trip test alone does not prove interoperability with other archive implementations or unsafe-path rejection. If those outcomes are required, assess independent fixture/interoperability and rejection tests rather than inflating this test's claim.

## How to apply these examples

Do not match names, signatures, languages, or file layouts. Ask:

- What choices belong to the consumer in this product's domain?
- What implementation steps should the module own?
- Does the actual caller need knowledge of those hidden steps?
- Does the journey test use the supported interface and real implementation?
- What user outcome do its assertions establish, and what remains unproven?

Multiple public calls can be correct consumer composition. One public call can still expose a shallow, confusing interface. The distinction is who must understand and coordinate implementation details—not the number of methods.

External fixtures are also contextual: a local server returning vendor CSVs can replace an external vendor for a journey that downloads and imports data, but returning a mocked `ImportSummary` would bypass the import behavior under assessment.
