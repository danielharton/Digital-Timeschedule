import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PropTypes from 'prop-types';
import { formatDate } from '../utils/utilFunctions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import DownloadIcon from '@mui/icons-material/Download';
import { getApiBaseUrl } from '../utils/apiBaseUrl';



const GenericTable = ({ title, subtitle, buttonText, buttonAction, secondButtonText, secondButtonAction, columns, data, childrenColumns = [],
    childrenData, isExtendedTable = false, edit, onEdit, actions = [], childrenActions = [] }) => {

    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5); 
    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        setPage(0);
    }, [data.length]);


    
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); 
    };


    
    const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


    const toggleRow = (rowId) => {
        setExpandedRows((prev) => ({
            ...prev,
            [rowId]: !prev[rowId], 
        }));
    };
    const hasChildren = (row) => {

        return childrenData && childrenData[row.id] && childrenData[row.id].length > 0;
    };

    
    const isImageFile = (filePath) => {
        const extension = filePath.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
    };

    
    const handleDownload = (fileUrl) => {
        window.open(fileUrl, '_blank');
    };
    return (
        <>
            <Box className="flex flex-row justify-between" sx={{ m: 2 }}>
                <Typography variant="h4">
                    {title}
                </Typography>
                <Typography variant="h6">
                    {subtitle}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>


                    {buttonText && buttonAction && (
                        <Button variant="contained" onClick={buttonAction} sx={{ mt: -4, backgroundColor: '#0d47a1', color: 'white', mr: 1 }}>
                            {buttonText}
                        </Button>
                    )}
                    {secondButtonText && secondButtonAction && (
                        <Button variant="contained" onClick={secondButtonAction} sx={{ mt: -4 }} color="error">
                            {secondButtonText}
                        </Button>
                    )}
                </Box>
            </Box>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page"
            />
            <TableContainer component={Paper} style={{ marginTop: 20, overflowX: 'auto', zoom: '80%' }}>
                <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '4px 8px', fontSize: '0.875rem' } }}>
                    <TableHead>
                        <TableRow>{isExtendedTable === true && (
                            <TableCell padding="none" sx={{ width: '1%' }}></TableCell>
                        )}{columns.map((column) => (
                            <TableCell key={`generic-table-column-${column.field}`}>{column.headerName}</TableCell>
                        ))}{edit && <TableCell>Actions</TableCell>} {}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row, index) => (
                            <React.Fragment key={`generic_table_row_paginated_parent_${row.id}_${index}`}>
                                <TableRow key={`generic_table_row_paginated_${row.id}_${index}`}>{isExtendedTable === true && (
                                    <TableCell padding="none" sx={{ width: '1%' }}>
                                        <IconButton
                                            aria-label="expand row"
                                            size="small"
                                            onClick={() => toggleRow(row.id)}
                                        >
                                            {expandedRows[row.id] ? (
                                                <KeyboardArrowUpIcon />
                                            ) : (
                                                <KeyboardArrowDownIcon />
                                            )}
                                        </IconButton>
                                    </TableCell>
                                )}{columns.map((column) => {
                                    if (row[column.field] === null) {
                                        return <TableCell key={`generic-table-second-${column.field}`}></TableCell>;
                                    }
                                    if (column.renderCell) {
                                        return (
                                            <TableCell key={`generic-table-rendercell-${column.field}`}>
                                                {column.renderCell({ row, value: row[column.field] })}
                                            </TableCell>
                                        );
                                    }

                                    if (column.type === 'date') {
                                        return <TableCell key={`generic-table-date-${column.field}`}>{formatDate(new Date(row[column.field]))}</TableCell>;
                                    } else if (column.type === 'filepath') {
                                        return (
                                            <TableCell key={`generic-table-filepath-${column.field}`}>
                                                {isImageFile(row[column.field]) ? (
                                                    <Avatar
                                                        src={row[column.field]}
                                                        alt="file"
                                                        sx={{ width: 70, height: 70, cursor: 'pointer' }}
                                                        onClick={() => handleDownload(`${getApiBaseUrl()}/${row[column.field]}`)} 
                                                    />
                                                ) : (
                                                    <IconButton
                                                        onClick={() => handleDownload(`${getApiBaseUrl()}/${row[column.field]}`)}
                                                    >
                                                        <DownloadIcon sx={{ color: '#4A90E2' }} /> {}
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        );
                                    } else {
                                        return <TableCell key={`generic-table-default-${column.field}`}>{row[column.field]}</TableCell>;
                                    }
                                })}{(edit || (actions && actions.length > 0)) && (
                                    <TableCell style={{ width: '0', whiteSpace: 'nowrap' }}>
                                        <Box display="flex" alignItems="center">
                                            {edit && (
                                                <IconButton
                                                    onClick={() => onEdit(row.id)}
                                                    style={{ color: 'black' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            {actions && actions.map((action, i) => (
                                                (!action.condition || (typeof action.condition === 'function' && action.condition(row))) && (
                                                    <IconButton
                                                        key={`generic-table-dynamic-actions-${i}`}
                                                        onClick={() => action.onClick(row.id, row)}
                                                        style={{ color: action.color || 'black' }}
                                                    >
                                                        {typeof action.icon === 'function' ? action.icon(row) : action.icon}
                                                    </IconButton>
                                                )
                                            ))}
                                        </Box>
                                    </TableCell>
                                )}
                                </TableRow>
                                {hasChildren(row) && (
                                    <TableRow key={`generic-table-children-row-${row.id}`}>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length}>
                                            <Collapse in={expandedRows[row.id]} timeout="auto">
                                                <Box>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                {childrenColumns.map(col => (
                                                                    <TableCell key={col.field}>{col.headerName}</TableCell>
                                                                ))}
                                                                {childrenActions && childrenActions.length > 0 && <TableCell>Actions</TableCell>}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {childrenData[row.id] && childrenData[row.id].map((childRow) => (
                                                                <TableRow key={`generic-table-child-row-${childRow.id}`}>
                                                                    {childrenColumns && childrenColumns.map((column) => {

                                                                        if (column.type === 'filepath' && childRow[column.field] !== null) {

                                                                            return (
                                                                                <TableCell key={`generic-table-filepath-${column.field}`}>
                                                                                    {isImageFile(childRow[column.field]) ? (
                                                                                        <Avatar
                                                                                            src={childRow[column.field]}
                                                                                            alt="file"
                                                                                            sx={{ width: 70, height: 70, cursor: 'pointer' }}
                                                                                            onClick={() => handleDownload(`${getApiBaseUrl()}/${childRow[column.field]}`)} 
                                                                                        />
                                                                                    ) : (
                                                                                        <IconButton
                                                                                            onClick={() => handleDownload(`${getApiBaseUrl()}/${childRow[column.field]}`)}
                                                                                        >
                                                                                            {column.field === 'requirement_file_path' ? <DownloadIcon sx={{ color: '#4A90E2' }} /> : <DownloadIcon sx={{ color: 'green' }} />} {}
                                                                                        </IconButton>
                                                                                    )}
                                                                                </TableCell>
                                                                            );


                                                                        } else {

                                                                            return (<TableCell key={`generic-table-child-column-${childRow.id}-${column.field}`}>
                                                                                {childRow[column.field]}
                                                                            </TableCell>
                                                                            )
                                                                        }


                                                                    })}
                                                                    {childrenActions && childrenActions.length > 0 && (
                                                                        <TableCell style={{ width: '0', whiteSpace: 'nowrap' }}>
                                                                            <Box display="flex" alignItems="center">
                                                                                {childrenActions.map((action, i) => (
                                                                                    (!action.condition || (typeof action.condition === 'function' && action.condition(childRow))) && (
                                                                                        <IconButton
                                                                                            key={`generic-table-child-dynamic-actions-${i}`}
                                                                                            onClick={() => action.onClick(childRow.id, childRow)}
                                                                                            style={{ color: action.color || 'black' }}
                                                                                        >
                                                                                            {typeof action.icon === 'function' ? action.icon(childRow) : action.icon}
                                                                                        </IconButton>
                                                                                    )
                                                                                ))}
                                                                            </Box>
                                                                        </TableCell>
                                                                    )}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

GenericTable.propTypes = {
    title: PropTypes.string.isRequired,
    buttonText: PropTypes.string,
    buttonAction: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.shape({
        field: PropTypes.string.isRequired,
        headerName: PropTypes.string.isRequired,
        type: PropTypes.string,
    })).isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    edit: PropTypes.bool,
    onEdit: PropTypes.func,
    childrenColumns: PropTypes.func,
    childrenData: PropTypes.func,
    isExtendedTable: PropTypes.bool,
    childrenActions: PropTypes.arrayOf(PropTypes.shape({
        icon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
        onClick: PropTypes.func.isRequired,
        color: PropTypes.string,
        condition: PropTypes.func,
    })),
};

export default GenericTable;
