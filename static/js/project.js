function newProjectDiv (project, options) {
    return itemDiv(
        project, 'project', 'username', 'projectname', 'notes', options)
};

function newCollectionDiv (collection, options) {
    return itemDiv(
        collection, 'collection', 'username', 'name', 'description',
        options)
};

function itemDiv (item, itemType, ownerUsernamePath, nameField,
        descriptionField, options) {
    var extraFields = options['extraFields'],
        div = document.createElement('div');

    if (!item.thumbnail) {
        div.innerHTML = '<i class="no-image fas ' +
            (itemType == 'collection' ? 'fa-briefcase' : 'fa-question-circle') +
            '"></i>'
    }

    div.innerHTML +=
        '<a href="' + itemType +
        '?user=' + encodeURIComponent(eval('item.' + ownerUsernamePath)) +
        '&' + itemType + '=' + encodeURIComponent(item[nameField]) +
        '"><img class="thumbnail" alt="' +
        (item.thumbnail ? escapeHtml(item[nameField]) : '') +
        '" title="' + escapeHtml(item[descriptionField]) +
        (item.thumbnail ? '" src="' + item.thumbnail  + '"' : '') +
        '"><span class="' + itemType + '-name">' + escapeHtml(item[nameField]) +
        '</span></a>';

    if (extraFields) {
        Object.keys(extraFields).forEach(function (fieldName) {
            var attribute = extraFields[fieldName];
            div.appendChild(
                window[fieldName + 'Span'](eval('item.' + attribute)));
        });
    }

    div.classList.add(itemType, options['size']);

    if (options['gridSize']) {
        div.classList.add('pure-u-1-' + options['gridSize']);
    };

    if (options['withCollectionControls']) {
        // Adds controls to remove this project from a collection or choose it
        // as a thumbnail
        div.appendChild(collectionControls(item));
    }

    return div;
};

function fillProjectTitle (project, titleElement) {
    var h1 = titleElement.querySelector('h1');
    h1.innerHTML = project.projectname;
    if (canRename(project)) {
        new InPlaceEditor(
            h1,
            function () {
                SnapCloud.updateProjectName(
                    project.projectname,
                    h1.textContent,
                    function () {
                        location.href = 'project.html?user=' +
                            project.username + '&project=' +
                            h1.textContent
                    },
                    genericError
                );
            })
    }
    titleElement.append(authorSpan(project.username));
};

function fillProjectNotes (project, notesElement) {
    notesElement.innerHTML =
        project.notes ?
            escapeHtml(project.notes).replace(
                /(https?:\/\/[^\s,\(\)\[\]]+)/g, // good enough
                '<a href="$1" target="_blank">$1</a>') :
            ('<small>' +
                localizer.localize('This project has no notes') +
                '</small>');
    notesElement.title =
        localizer.localize('Press Shift + Enter to enter a newline');

    // In-place notes editor
    if (owns(project)) {
        new InPlaceEditor(
            notesElement,
            function () {
                SnapCloud.updateNotes(
                    pageProject(),
                    notesElement.innerText,
                    function () {
                        if (notesElement.innerText == '') {
                            notesElement.innerHTML = '<small>' +
                                localizer.localize(
                                    'This project has no notes') + '</small>';
                        }
                    },
                    genericError
                );
            }
        );
    }
};

function fillProjectDates (project, datesElement) {
    document.querySelector('.created span').innerHTML =
        formatDate(project.created);
    document.querySelector('.updated span').innerHTML =
        formatDate(project.lastupdated);

    if (project.ispublic) {
        if (project.ispublished) {
            document.querySelector('.shared').hidden = true;
            document.querySelector('.published').hidden = false;
            document.querySelector('.published span').innerHTML =
                formatDate(project.firstpublished);
        } else {
            document.querySelector('.shared').hidden = false;
            document.querySelector('.shared span').innerHTML =
                formatDate(project.lastshared);
            document.querySelector('.published').hidden = true;
        }
    } else {
        document.querySelector('.shared').innerHTML =
            localizer.localize('This project is private') + '.';
        document.querySelector('.published').hidden = true;
    }
};

function fillRemixInfo (project, infoElement) {
    if (project.remixedfrom) {
        infoElement.innerHTML = localizer.localize('(remixed from ');
        if (project.remixedfrom.projectname) {
            infoElement.append(
                projectSpan(
                    project.remixedfrom.username,
                    project.remixedfrom.projectname));
            infoElement.append(authorSpan(project.remixedfrom.username));
        } else {
            infoElement.append('a project that no longer exists');
        }
        infoElement.innerHTML += ')';
    }
};

function setProjectControlButtonsVisibility (project, buttonsElement) {
    buttonsElement.querySelector('.embed-button').hidden = !project.ispublic;
    // why whould you want to flag your own project?
    buttonsElement.querySelector('.flag').hidden = owns(project);
    buttonsElement.querySelector('.delete').hidden = !canDelete(project);
};

function setProjectShareButtonsVisibility (project, buttonsElement) {
    buttonsElement.querySelector('.share').hidden =
        project.ispublic || !canShare(project);
    buttonsElement.querySelector('.unshare').hidden =
        !project.ispublic || !canShare(project);
    buttonsElement.querySelector('.publish').hidden =
        (!project.ispublic || project.ispublished) ||
            !canPublish(project) || sessionStorage.role === 'banned';
    buttonsElement.querySelector('.unpublish').hidden =
        (!project.ispublic || !project.ispublished) || !canUnpublish(project);
};


function loadProjectViewer (project, placeholder) {
    function doLoadIt () {
        var iframe = document.createElement('iframe');
        iframe.allowfullscreen = true;
        iframe.setAttribute('allow', 'geolocation; microphone; camera');
        iframe.height = 406;
        iframe.src = projectURL(project.username, project.projectname) +
            '&embedMode&noExitWarning&noRun';
        placeholder.parentNode.replaceChild(iframe, placeholder);
    }
    if (document.visibilityState == 'visible') {
        doLoadIt();
    } else {
        document.onvisibilitychange = function() {
            doLoadIt();
            document.onvisibilitychange = nop;
        };
    }
};

function fillCollectionTitle (collection, titleElement) {
    var h1 = titleElement.querySelector('h1');
    h1.innerHTML = collection.name;
    if (canRename(collection) && collection.id !== 0) {
        new InPlaceEditor(
            h1,
            function () {
                SnapCloud.updateCollectionName(
                    collection.username,
                    collection.name,
                    h1.textContent,
                    function () {
                        location.href = 'collection.html?user=' +
                            collection.username + '&collection=' +
                            h1.textContent;
                    },
                    genericError
                );
            },
            '' // no default text
        )
    }
    titleElement.appendChild(authorSpan(collection.username));
};

function fillCollectionThumbnail (collection, thumbnailElement) {
    if (collection.thumbnail) {
        thumbnailElement.src = collection.thumbnail || '';
    } else {
        var i = document.createElement('i');
        i.classList.add('no-image');
        i.classList.add('fas');
        i.classList.add('fa-briefcase');
        thumbnailElement.parentNode.appendChild(i);
        thumbnailElement.remove();
    }
};

function fillCollectionDescription (collection, descriptionElement) {
    var noDescriptionHTML = '<small>' +
            localizer.localize('This collection has no description') +
            '</small>';

    descriptionElement.innerHTML =
        collection.description ?
            collection.description.replace(
                /(https?:\/\/[^\s,\(\)\[\]]+)/g, // good enough
                '<a href="$1" target="_blank">$1</a>') :
        noDescriptionHTML;

    descriptionElement.title =
        localizer.localize('Press Shift + Enter to enter a newline');
    if (canEditDescription(collection)) {
        new InPlaceEditor(
            descriptionElement,
            function () {
                SnapCloud.updateCollectionDescription(
                    collection.username,
                    collection.name,
                    descriptionElement.innerText,
                    function () {
                        if (descriptionElement.innerText == '') {
                            descriptionElement.innerHTML = noDescriptionHTML;
                        }
                    },
                    genericError
                );
            },
            'This collection has no description'
        );
    }
};

function fillCollectionDates (collection, datesDiv) {
    datesDiv.querySelector('.created span').innerHTML =
        formatDate(collection.created_at);
    datesDiv.querySelector('.updated span').innerHTML =
        formatDate(collection.updated_at);

    if (collection.shared) {
        datesDiv.querySelector('.shared span').innerHTML =
            formatDate(collection.shared_at);
        if (collection.published) {
            datesDiv.querySelector('.published span').innerHTML =
                formatDate(collection.published_at);
        } else {
            datesDiv.querySelector('.published').hidden = true;
        }
    } else {
        datesDiv.querySelector('.shared').hidden = true;
        datesDiv.querySelector('.published').hidden = true;
    }
};

function setCollectionButtonsVisibility (collection, buttonsDiv) {
    // Set up all buttons
    buttonsDiv.querySelector('.share').hidden =
        collection.shared || !canShare(collection);
    buttonsDiv.querySelector('.unshare').hidden =
        !collection.shared || !canShare(collection);
    buttonsDiv.querySelector('.publish').hidden =
        (!collection.shared || collection.published) ||
        !canPublish(collection) || sessionStorage.role === 'banned';
    buttonsDiv.querySelector('.unpublish').hidden =
        (!collection.shared || !collection.published) ||
        !canUnpublish(collection);
    buttonsDiv.querySelector('.delete').hidden =
        !canDelete(collection);
};

function setupCollectionEditorControls (collection, editorsElement) {
    var addEditorAnchor = editorsElement.querySelector('.add-editor'),
        editorListUl = editorsElement.querySelector('.editor-list');

    // set up "add editor" anchor
    addEditorAnchor.hidden = !owns(collection);
    addEditorAnchor.onclick = function () {
        var newEditorInput = editorsElement.querySelector('.new-editor');
        this.hidden = true;
        newEditorInput.placeholder = localizer.localize('Username');
        newEditorInput.value = '';
        newEditorInput.hidden = false;
        newEditorInput.classList.add('flash');
        newEditorInput.focus();
        newEditorInput.onkeypress = function (event) {
            var code = (event.keyCode ? event.keyCode : event.which);
            if (code == 13 && !event.shiftKey) {
                SnapCloud.addEditorToCollection(
                    collection.username,
                    collection.name,
                    newEditorInput.value,
                    function () {
                        var li = newEditorLi(newEditorInput.value);
                        newEditorInput.hidden = true;
                        newEditorInput.classList.remove('flash');
                        addEditorAnchor.hidden = false;

                        editorListUl.append(li);
                        li.classList.add('flash');
                    },
                    function () {
                        newEditorInput.value = '';
                        newEditorInput.classList.remove('flash');
                        newEditorInput.classList.remove('warning-flash');
                        setTimeout(
                            function () {
                                newEditorInput.classList.add('warning-flash');
                            },
                            10
                        );
                        newEditorInput.focus();
                    }
                );
            }
        };
    }

    addEditorAnchor.title =
        localizer.localize('Add an editor to this collection');
    editorListUl.title =
        localizer.localize('Users who can edit this collection');
    editorListUl.append(newEditorLi(collection.username));

    function newEditorLi (username) {
        var editorLi = document.createElement('li'),
            removeAnchor = document.createElement('a'),
            icon = document.createElement('i');

        editorLi.classList.add('editor');
        editorLi.append(userAnchor(username));

        if (owns(collection) && username !== collection.username) {
            icon.classList.add('fas');
            icon.classList.add('fa-times-circle');
            removeAnchor.classList.add('remove-editor');
            removeAnchor.classList.add('clickable');
            removeAnchor.append(icon);
            removeAnchor.onclick = function () {
                SnapCloud.removeEditorFromCollection(
                    collection.username,
                    collection.name,
                    username,
                    function () {
                        editorLi.classList.add('warning-flash');
                        setTimeout( function () { editorLi.remove(); }, 1000);
                    },
                    genericError
                );
            };
            editorLi.append(removeAnchor);
        }
        return editorLi;
    };

    if (collection.editors && collection.editors[0]) {
        collection.editors.forEach(function (editor) {
            editorListUl.append(newEditorLi(editor.username));
        });
    }
}

function collectionControls (project) {
    var controls = document.createElement('div'),
        removeAnchor = document.createElement('a'),
        thumbnailAnchor = document.createElement('a');

    controls.classList.add('collection-controls');

    removeAnchor.title = localizer.localize('Remove from collection');
    removeAnchor.classList.add('clickable');
    removeAnchor.innerHTML = '<i class="fas fa-times-circle"></i>';
    removeAnchor.onclick = function () {
        confirmRemoveFromCollection(project);
    };
    controls.appendChild(removeAnchor);

    if (!(getUrlParameter('collection') == 'Flagged' &&
            getUrlParameter('user') == 'snapcloud')) {
        // Flagged collection doesn't have a thumbnail
        thumbnailAnchor.title =
            localizer.localize('Set as collection thumbnail');
        thumbnailAnchor.classList.add('clickable');
        thumbnailAnchor.innerHTML = '<i class="fas fa-image"></i>';
        thumbnailAnchor.onclick = function () {
            chooseAsThumbnailForCollection(project);
        };
        controls.appendChild(thumbnailAnchor);
    }

    return controls;
};

function downloadProject (project) {
    SnapCloud.getPublicProject(
        project.projectname,
        project.username,
        function (contents) {
            var blob = new Blob([contents], {type: 'text/xml'});
            saveAs(blob, project.projectname + '.xml');
        },
        function (response) {
            genericError(response.errors[0], 'Could not fetch project');
        }
    );
};

function chooseAsThumbnailForCollection (project) {
    SnapCloud.setCollectionThumbnail(
        getUrlParameter('user'),
        getUrlParameter('collection'),
        project.id,
        function () { location.reload(); },
        genericError
    );
};

// Could probably refactor these. Not sure it's worth the hassle though.
function confirmRemoveFromCollection (project) {
    confirm(
        localizer.localize(
            'Are you sure you want to remove this project from the collection?'
        ),
        function (ok) {
            if (ok) {
                SnapCloud.removeProjectFromCollection(
                    getUrlParameter('user'),
                    getUrlParameter('collection'),
                    project.id,
                    function () { location.reload(); },
                    genericError
                );
            }
        },
        confirmTitle('Share project')
    );
};

function confirmShareProject (project, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize('Are you sure you want to share this project?'),
        function (ok) {
            if (ok) {
                SnapCloud.shareProject(
                    project.projectname,
                    project.username,
                    function () {
                        alert(
                            localizer.localize(
                                'You can now access this project at:') +
                                '<br><a href="' + location.href + '">' +
                                location.href + '</a>',
                            { title: localizer.localize('Project shared') },
                            function () {
                                project.ispublic = true;
                                setProjectShareButtonsVisibility(
                                    project,
                                    datesDiv
                                );
                                fillProjectDates(project, datesDiv);
                            }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Share project')
    );
};

function confirmShareCollection (collection, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize('Are you sure you want to share this collection?'),
        function (ok) {
            SnapCloud.shareCollection(
                collection.username,
                collection.name,
                function () {
                    alert(
                        localizer.localize(
                            'This collection can now be accessed at:') +
                            '<br><a href="' + location.href + '">' +
                            location.href + '</a>',
                        { title: localizer.localize('Collection shared') },
                        function () {
                            location.reload();
                        }
                    );
                },
                genericError
            );
        },
        confirmTitle('Share collection')
    );
};

function confirmUnshareProject (project, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize(
            'Are you sure you want to stop sharing this project?'),
        function (ok) {
            if (ok) {
                SnapCloud.unshareProject(
                    project.projectname,
                    project.username,
                    function () {
                        alert(
                            localizer.localize('This project is now private.'),
                            { title: localizer.localize('Project unshared') },
                            function () {
                                project.ispublic = false;
                                project.ispublished = false;
                                setProjectShareButtonsVisibility(
                                    project,
                                    datesDiv
                                );
                                fillProjectDates(project, datesDiv);
                            }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Unshare project')
    );
};

function confirmUnshareCollection (collection, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize(
            'Are you sure you want to stop sharing this collection?'),
        function (ok) {
            if (ok) {
                SnapCloud.unshareCollection(
                    collection.username,
                    collection.name,
                    function () {
                        alert(
                            localizer.localize(
                                'This collection is now private.'),
                            {
                                title:
                                    localizer.localize('Collection unshared')
                            },
                            function () {
                                location.reload();
                            }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Unshare collection')
    );
};

function confirmPublishProject (project, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize('Are you sure you want to publish this project<br>' +
            'and make it visible in the Snap<em>!</em> website?'),
        function (ok) {
            if (ok) {
                SnapCloud.publishProject(
                    project.projectname,
                    project.username,
                    function () {
                        alert(
                            localizer.localize(
                                'This project is now listed in the ' +
                                    'Snap<em>!</em> site.'),
                            { title: localizer.localize('Project published') },
                            function () {
                                project.ispublished = true;
                                setProjectShareButtonsVisibility(
                                    project,
                                    datesDiv
                                );
                                fillProjectDates(project, datesDiv);
                            }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Publish project')
    );
};

function confirmPublishCollection (collection, buttonsDiv, datesDiv) {
    confirm(
        localizer.localize(
            'Are you sure you want to publish this collection<br>' +
            'and make it visible in the Snap<em>!</em> website?'),
        function (ok) {
            if (ok) {
                SnapCloud.publishCollection(
                    collection.username,
                    collection.name,
                    function () {
                        alert(
                            localizer.localize(
                                'This collection is now listed in the ' +
                                    'Snap<em>!</em> site.'),
                            { title:
                                localizer.localize('Collection published') },
                            function () {
                                location.reload();
                            }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Publish collection')
    );
};

function confirmUnpublishProject (project, buttonsDiv, datesDiv) {
    function done () {
        alert(
            localizer.localize(
                'This project is not listed in the Snap<em>!</em> site anymore.'
            ),
            { title: localizer.localize('Project unpublished') },
            function () {
                project.ispublished = false;
                setProjectShareButtonsVisibility(
                    project,
                    datesDiv
                );
                fillProjectDates(project, datesDiv);
            }
        );
    };

    confirm(
        localizer.localize(
            'Are you sure you want to unpublish this project<br>' +
            'and hide it from the Snap<em>!</em> website?'),
        function (ok) {
            if (ok) {
                if (sessionStorage.username !== project.username) {
                    reasonDialog(
                        project,
                        function (reason) {
                            SnapCloud.withCredentialsRequest(
                                'POST',
                                '/projects/' +
                                    encodeURIComponent(project.username) + '/' +
                                    encodeURIComponent(project.projectname) +
                                    '/metadata?ispublished=false&reason=' +
                                    encodeURIComponent(reason),
                                done,
                                genericError,
                                'Could not unpublish project'
                            );
                        }
                    );
                } else {
                    SnapCloud.unpublishProject(
                        project.projectname,
                        project.username,
                        done,
                        genericError
                    );
                }
            }
        },
        confirmTitle('Unpublish project')
    );
};

function confirmUnpublishCollection (collection, buttonsDiv, datesDiv) {
    function done () {
        alert(
            localizer.localize(
                'This collection is not listed in the ' +
                    'Snap<em>!</em> site anymore.'),
            { title: localizer.localize('Collection unpublished') },
            function () {
                location.reload();
            }
        );
    };

    confirm(
        localizer.localize(
            'Are you sure you want to unpublish this collection<br>' +
            'and hide it from the Snap<em>!</em> website?'),
        function (ok) {
            if (ok) {
                if (sessionStorage.username !== collection.username) {
                    reasonDialog(
                        collection,
                        function (reason) {
                            SnapCloud.withCredentialsRequest(
                                'POST',
                                '/users/' +
                                    encodeURIComponent(
                                        collection.username) +
                                    '/collections/' +
                                    encodeURIComponent(collection.name) +
                                    '/metadata?ispublished=false&reason=' +
                                    encodeURIComponent(reason),
                                done,
                                genericError,
                                'Could not unpublish collection'
                            );
                        }
                    );
                } else {
                    SnapCloud.unpublishCollection(
                        collection.username,
                        collection.name,
                        done,
                        genericError
                    );
                }
            }
        },
        confirmTitle('Unpublish collection')
    );
};

function confirmDeleteProject (project) {
    function done () {
        alert(
            localizer.localize('This project has been deleted.'),
            { title: localizer.localize('Project deleted') },
            function () {
                location.href =
                    (sessionStorage.username !== project.username)
                        ? 'index'
                        : 'my_projects';
            }
        );
    };

    confirm(
        localizer.localize('Are you sure you want to delete this project?') +
        '<br>' + '<i class="warning fa fa-exclamation-triangle"></i> ' +
        localizer.localize('WARNING! This action cannot be undone!') +
        ' <i class="warning fa fa-exclamation-triangle"></i>',
        function (ok) {
            if (ok) {
                if (sessionStorage.username !== project.username) {
                    reasonDialog(
                        project,
                        function (reason) {
                            SnapCloud.withCredentialsRequest(
                                'DELETE',
                                '/projects/' +
                                    encodeURIComponent(project.username) + '/'
                                    + encodeURIComponent(project.projectname) +
                                    '?reason=' + encodeURIComponent(reason),
                                done,
                                genericError,
                                'Could not delete project'
                            );
                        }
                    );
                } else {
                    SnapCloud.deleteProject(
                        project.projectname,
                        project.username,
                        done,
                        genericError
                    );
                }
            }
        },
        confirmTitle('Delete project')
    );
};

function confirmDeleteCollection (collection) {
    function done () {
        alert(
            localizer.localize('This collection has been deleted.'),
            { title: localizer.localize('Collection deleted') },
            function () {
                location.href =
                    (sessionStorage.username !== collection.username)
                        ? 'index'
                        : 'my_collections';
            }
        );
    };

    confirm(
        localizer.localize('Are you sure you want to delete this collection?')
        + '<br>' +
        '<i class="warning fa fa-exclamation-triangle"></i> ' +
        localizer.localize('WARNING! This action cannot be undone!') +
        ' <i class="warning fa fa-exclamation-triangle"></i>',
        function (ok) {
            if (ok) {
                if (sessionStorage.username !== collection.username) {
                    reasonDialog(
                        collection,
                        function (reason) {
                            SnapCloud.withCredentialsRequest(
                                'DELETE',
                                '/users/' +
                                    encodeURIComponent(
                                        collection.username) +
                                    '/collections/' +
                                    encodeURIComponent(collection.name) +
                                    '?reason=' + encodeURIComponent(reason),
                                done,
                                genericError,
                                'Could not delete collection'
                            );
                        }
                    );
                } else {
                    SnapCloud.deleteCollection(
                        collection.username,
                        collection.name,
                        done,
                        genericError
                    );
                }
            }
        },
        confirmTitle('Delete collection')
    );
};

function confirmFlagProject (project) {
    confirm(
        localizer.localize(
            'Are you sure you want to flag this project as inappropriate?'),
        function (ok) {
            if (ok) {
                SnapCloud.addProjectToCollection(
                    'snapcloud',
                    'Flagged',
                    project.username,
                    project.projectname,
                    function () {
                        alert(
                            localizer.localize(
                                'This project has been flagged.'),
                            { title: localizer.localize('Project flagged') }
                        );
                    },
                    genericError
                );
            }
        },
        confirmTitle('Flag project')
    );
};

function owns (item) {
    return sessionStorage.username == item.username
};

function ownsOrIsAdmin (item) {
    // Not to worry. Actual secure permission check is performed in the backend.
    return owns(item) || sessionStorage.role === 'admin';
};

function canShare (item) {
    return ownsOrIsAdmin(item);
};

function canPublish (item) {
    return ownsOrIsAdmin(item);
};

function canRename (item) {
    return ownsOrIsAdmin(item);
};

function canEditNotes (item) {
    return ownsOrIsAdmin(item);
};

function canEditDescription (collection) {
    return ownsOrIsAdmin(collection);
};
function canUnpublish (item) {
    return (sessionStorage.username == item.username) ||
        [ 'admin', 'moderator', 'reviewer' ].indexOf(sessionStorage.role) > -1;
};

function canDelete (item) {
    return (sessionStorage.username == item.username) ||
        [ 'admin', 'moderator' ].indexOf(sessionStorage.role) > -1;
};

function reasonDialog (item, onSuccess) {
    var itemType = item.owner ? 'collection' : 'project',
        itemName = item.owner ? item.name : item.projectname,
        form = document.createElement('form'),
        reasons = {
            hack: 'Your ' + itemType + ' <strong>' + itemName + '</strong>' +
                    ' was trying to exploit a security vulnerability.',
            coc: 'Your ' + itemType + ' <strong>' + itemName + '</strong>' +
                    ' has been found to violate the <a href="' + baseURL +
                    '/coc">Code of Conduct</a>' +
                    ' of the Snap<em>!</em> community website.',
            dmca: 'Your ' + itemType + ' <strong>' + itemName + '</strong>' +
                    ' has been found to violate the <a href="' + baseURL +
                    '/dmca">DMCA policy</a>' +
                    ' of the Snap<em>!</em> community website.'
        };
    form.classList.add('reasons');
    new Map([
        [ 'hack', localizer.localize('Security vulnerability') ],
        [ 'coc', localizer.localize('Code of Conduct violation') ],
        [ 'dmca', localizer.localize('DMCA violation') ]
    ]).forEach(function (value, key) {
        form.innerHTML +=
            '<span class="option"><input type="radio" name="reason" value="' +
            key + '"><label for="' + key +'">' + value + '</label></span>';
    });
    dialog(
        'Please choose a reason',
        form,
        function () {
            onSuccess.call(
                this,
                reasons[
                    form.querySelector('input[name="reason"]:checked').value]
            );
        }
    );
};

function embedDialog (project) {
    var codeArea = document.createElement('textarea'),
        form = document.createElement('form');

    form.classList.add('embed-options');
    form.innerHTML =
            '<span class="info">' + localizer.localize(
                'Please select the elements you wish to include in the '+
                'embedded project viewer:') + '</span>';

    new Map([
        [ 'title', localizer.localize('Project title') ],
        [ 'author', localizer.localize('Project author') ],
        [ 'edit-button', localizer.localize('Edit button') ],
        [ 'pause-button', localizer.localize('Pause button') ]
    ]).forEach(function (value, key) {
        form.innerHTML += '<span class="option"><input type="checkbox" name="' +
            key + '" value="' + key + '" checked><label for="' + key +'">' +
            value + '</label></span>';
    });
    form.appendChild(codeArea);

    codeArea.classList.add('embed-code');
    codeArea.set = function () {
        codeArea.value =
            '<iframe allowfullscreen allow="geolocation; microphone; camera" ' +
            'frameBorder=0 src="' + baseURL + '/embed?project=' +
            project.projectname + '&user=' + project.username +
            (form.elements['title'].checked ? '&showTitle=true' : '') +
            (form.elements['author'].checked ? '&showAuthor=true' : '') +
            (form.elements['edit-button'].checked ? '&editButton=true' : '') +
            (form.elements['pause-button'].checked ? '&pauseButton=true' : '') +
            '" width="480" height="390"></iframe>';
    };
    codeArea.set();

    form.querySelectorAll('input').forEach(function (input) {
        input.onchange = function () { codeArea.set(); }
    });

    dialog('Embed Options', form);
};

function collectProject (project) {
    // Add this project to a user's collection
    // TODO get all collections where user has write permission

    var form = document.createElement('form'),
        collections;

    form.classList.add('collect-form');
    form.innerHTML =
        '<p class="info">' +
        localizer.localize('Please select the collection to which you want ' +
        'to add this project:') + '</p>';

    SnapCloud.getUserCollections(
        null, // username is implicit
        null, // page
        null, // pageSize
        null, // searchTerm
        function (response) {
            collections = response.collections;
            if (collections[0]) {
                var select = document.createElement('select');
                collections.forEach(function (collection) {
                    var option = document.createElement('option')
                    option.value = collection.name;
                    option.name = 'collection';
                    option.innerHTML = escapeHtml(collection.name);
                    select.appendChild(option);
                });
                form.appendChild(select);
            } else {
                form.innerHTML = '<p>' +
                    localizer.localize('You do not have any collections.') +
                    '</p>';
            }
            doneLoading('.collect-form');
        },
        genericError
    );

    dialog(
        'Add project to collection',
        form,
        function () {
            var collection = collections.find(
                    function(collection) {
                        return collection.name ===
                            form.querySelector('select').value;
                    }
            );
            SnapCloud.addProjectToCollection(
                collection.username,
                collection.name,
                project.username,
                project.projectname,
                function () {
                    alert(
                        localizer.localize('Project added to collection') + '.',
                        { title:
                            localizer.localize('Project added to collection') }
                    );
                },
                genericError
            );
        },
        nop,
        function () { beganLoading('.collect-form'); } // onOpen
    );

};

function toggleFullScreen () {
    var embed = document.querySelector('.embed'),
        iframe = document.querySelector('.embed iframe'),
        world = iframe.contentWindow.world,
        buttons = document.querySelector('.buttons');
    if (embed.fullScreen) {
        embed.fullScreen = false;
        embed.style = embed.oldStyle;
        iframe.style = iframe.oldStyle;
        buttons.style = buttons.oldStyle;
        document.body.style.overflow = 'auto';
        buttons.style = buttons.oldStyle;
    } else {
        embed.fullScreen = true;
        embed.oldStyle = embed.style;
        iframe.oldStyle = iframe.style;
        buttons.oldStyle = buttons.style
        embed.style.position = 'fixed';
        embed.style.left = 0;
        embed.style.top = 0;
        embed.style.width = '100vw';
        embed.style.height = '100vh';
        iframe.style.height = '100%';
        document.body.style.overflow = 'hidden';
        buttons.style.display = 'none';

    }
    world.worldCanvas.focus();
};

function runProject (event) {
    var iframe = document.querySelector('.embed iframe'),
        world = iframe.contentWindow.world,
        ide = world.children[0];
    if (event.shiftKey) {
        ide.toggleFastTracking();
    } else {
        ide.stage.threads.pauseCustomHatBlocks = false;
        ide.runScripts();
        if (ide.embedOverlay) {
            ide.embedOverlay.destroy();
            ide.embedPlayButton.destroy();
        }
    }
    world.worldCanvas.focus();
    refreshFlagButton(ide);
    refreshPauseButton(ide);
    refreshStopButton(ide);
};

function refreshFlagButton (ide) {
    var button = document.querySelector('.start-button');
    if (ide.stage.isFastTracked) {
        button.classList.replace('fa-flag', 'fa-bolt');
    } else {
        button.classList.replace('fa-bolt', 'fa-flag');
    }
};

function togglePauseProject () {
    var iframe = document.querySelector('.embed iframe'),
        world = iframe.contentWindow.world,
        ide = world.children[0];
    ide.togglePauseResume();
    refreshPauseButton(ide);
};

function refreshPauseButton (ide) {
    var button = document.querySelector('.pause-button');
    if (ide.stage.threads.isPaused()) {
        button.classList.replace('fa-pause', 'fa-play');
    } else {
        button.classList.replace('fa-play', 'fa-pause');
    }
};

function stopProject () {
    var iframe = document.querySelector('.embed iframe'),
        ide = iframe.contentWindow.world.children[0];
    ide.stopAllScripts();
    if (ide.embedOverlay) {
        ide.embedOverlay.destroy();
        ide.embedPlayButton.destroy();
    }
    refreshStopButton(ide);
    refreshPauseButton(ide);
};

function refreshStopButton (ide) {
    var button = document.querySelector('.stop-button');
    if (ide.stage.threads.pauseCustomHatBlocks) {
        button.classList.replace('fa-octagon', 'fa-stop');
    } else {
        button.classList.replace('fa-stop', 'fa-octagon');
    }
};

function editProject (project) {
    // an attempt to prevent reloading the project from the server when clicking
    // on the edit button. It works but it loses the remixID information.
    var iframe = document.querySelector('.embed iframe'),
        ide = iframe.contentWindow.world.children[0];
    window.open(snapURL + '#open:' + ide.serializer.serialize(ide.stage));
};
